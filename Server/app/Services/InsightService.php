<?php

namespace App\Services;

use App\Models\AIInsights;
use App\Models\Department;
use App\Models\Employee_Department;
use App\Models\FatigueScore;
use App\Models\WellnessEntries;
use App\Models\WellnessEntryExtraction;
use App\Models\WellnessEntryVector;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class InsightService
{
    private const OPENAI_MODEL = 'gpt-4o';
    private const OPENAI_TEMPERATURE = 0.4;
    private const OPENAI_MAX_TOKENS = 2000;
    private const HIGH_RISK_THRESHOLD = 70;

    public function __construct(protected NotificationService $notificationService) {}

    public function generateWeeklyInsight(int $departmentId): ?AIInsights
    {
        $department = Department::with('manager')->find($departmentId);
        if (! $department) {
            return null;
        }
        $endDate = now();
        $startDate = now()->subDays(7);
        $metrics = $this->gatherWeeklyMetrics($departmentId, $startDate, $endDate);

        if ($metrics['total_entries'] === 0) {
            return null;
        }

        $aiResponse = $this->callOpenAI($metrics, $department->name);
        if (empty($aiResponse)) {
            return null;
        }

        $insight = $this->saveInsight($departmentId, $aiResponse, $startDate, $endDate);

        if ($department->manager) {
            $this->notifyManager($department->manager->id, $insight);
        }
        return $insight;
    }

    public function gatherWeeklyMetrics(int $departmentId, Carbon $startDate, Carbon $endDate): array
    {
        $employeeIds = Employee_Department::where('department_id', $departmentId)
            ->pluck('employee_id')
            ->toArray();

        if (empty($employeeIds)) {
            return $this->emptyMetrics();
        }

        $entries = WellnessEntries::whereIn('employee_id', $employeeIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $entryIds = $entries->pluck('id')->toArray();

        return $this->compileMetrics(
            $entries,
            WellnessEntryVector::whereIn('entry_id', $entryIds)->get(),
            WellnessEntryExtraction::whereIn('entry_id', $entryIds)->get(),
            FatigueScore::whereIn('employee_id', $employeeIds)
                ->whereBetween('score_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->get(),
            $this->getPrevWeekHighRiskCount($employeeIds, $startDate),
            $employeeIds
        );
    }

    public function getInsightsForDepartment(int $departmentId, int $limit = 10): array
    {
        return AIInsights::where('department_id', $departmentId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function markAsRead(int $insightId): ?AIInsights
    {
        $insight = AIInsights::find($insightId);
        if (! $insight) {
            return null;
        }

        $insight->update(['is_read' => true]);
        return $insight->fresh();
    }

    public function getInsight(int $insightId): ?AIInsights
    {
        return AIInsights::with('department')->find($insightId);
    }

    public function getUnreadCount(int $departmentId): int
    {
        return AIInsights::where('department_id', $departmentId)
            ->where('is_read', false)
            ->count();
    }

    private function getPrevWeekHighRiskCount(array $employeeIds, Carbon $startDate): int
    {
        return (int) FatigueScore::whereIn('employee_id', $employeeIds)
            ->whereBetween('score_date', [
                $startDate->copy()->subDays(7)->toDateString(),
                $startDate->copy()->subDay()->toDateString(),
            ])
            ->where('total_score', '>=', self::HIGH_RISK_THRESHOLD)
            ->distinct('employee_id')
            ->count('employee_id');
    }

    private function compileMetrics($entries, $vectors, $extractions, $fatigueScores, int $prevWeekHighRisk, array $employeeIds): array
    {
        $avgSentiment = (float) ($vectors->avg('sentiment_score') ?? 0);
        $avgSleepHours = (float) ($extractions->avg('sleep_hours_before') ?? 0);
        $avgStress = (float) ($extractions->avg('stress_level') ?? 0);

        $latestScores = $fatigueScores->groupBy('employee_id')
            ->map(fn ($scores) => $scores->sortByDesc('score_date')->first());
        $highRiskEmployees = $latestScores->filter(fn ($s) => (int) $s->total_score >= self::HIGH_RISK_THRESHOLD);
        $highRiskCount = $highRiskEmployees->count();

        return [
            'total_entries' => $entries->count(),
            'unique_employees' => $entries->pluck('employee_id')->unique()->count(),
            'total_employees' => count($employeeIds),
            'avg_sentiment' => round($avgSentiment, 2),
            'sentiment_label' => $avgSentiment >= 0.3 ? 'positive' : ($avgSentiment <= -0.3 ? 'negative' : 'neutral'),
            'flagged_entries' => $vectors->where('is_flagged', true)->count(),
            'avg_sleep_hours' => round($avgSleepHours, 1),
            'poor_sleep_count' => $extractions->filter(fn ($e) => (float) $e->sleep_hours_before < 5)->count(),
            'avg_stress' => round($avgStress, 1),
            'high_stress_count' => $extractions->filter(fn ($e) => (int) $e->stress_level >= 4)->count(),
            'high_risk_count' => $highRiskCount,
            'prev_week_high_risk' => $prevWeekHighRisk,
            'high_risk_change' => $highRiskCount - $prevWeekHighRisk,
            'high_risk_employees' => $highRiskEmployees->map(fn ($s) => [
                'employee_id' => $s->employee_id,
                'score' => (int) $s->total_score,
                'risk_level' => $s->risk_level,
            ])->values()->toArray(),
            'top_concerns' => $this->aggregateConcerns($extractions),
        ];
    }

    private function aggregateConcerns($extractions): array
    {
        $counts = [];
        foreach ($extractions as $extraction) {
            foreach ($extraction->concerns_mentioned ?? [] as $concern) {
                $counts[$concern] = ($counts[$concern] ?? 0) + 1;
            }
        }
        arsort($counts);
        return array_slice($counts, 0, 5, true);
    }

    private function callOpenAI(array $metrics, string $departmentName): ?array
    {
        try {
            $response = OpenAI::chat()->create([
                'model' => self::OPENAI_MODEL,
                'messages' => [
                    ['role' => 'system', 'content' => $this->getSystemPrompt()],
                    ['role' => 'user', 'content' => $this->buildUserPrompt($metrics, $departmentName)],
                ],
                'temperature' => self::OPENAI_TEMPERATURE,
                'max_tokens' => self::OPENAI_MAX_TOKENS,
                'response_format' => ['type' => 'json_object'],
            ]);

            $parsed = json_decode($response->choices[0]->message->content ?? '{}', true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return null;
            }
            return $parsed;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function getSystemPrompt(): string
    {
        return <<<'PROMPT'
You are an expert HR wellness analyst for SmartShift. Generate a weekly wellness insight report.

Response must be valid JSON:
{
  "summary": "2-3 sentence executive summary",
  "key_findings": [{ "type": "positive|negative|neutral", "finding": "description" }],
  "metrics_analysis": { "overall_health": "healthy|concerning|critical", "trend": "improving|stable|declining" },
  "high_risk_employees": [{ "employee_id": 123, "concern": "reason", "recommended_action": "action" }],
  "recommendations": [{ "priority": "high|medium|low", "action": "recommendation", "reason": "why" }],
  "formatted_report": "Markdown report (2-3 paragraphs) for the manager"
}

Be specific, actionable, and prioritize employee wellbeing.
PROMPT;
    }

    private function buildUserPrompt(array $metrics, string $departmentName): string
    {
        $highRiskList = collect($metrics['high_risk_employees'])
            ->map(fn ($e) => "- Employee #{$e['employee_id']}: Score {$e['score']} ({$e['risk_level']} risk)")
            ->implode("\n");

        $concernsList = collect($metrics['top_concerns'])
            ->map(fn ($count, $concern) => "- {$concern}: {$count} mentions")
            ->implode("\n");

        return <<<PROMPT
Weekly wellness insight for **{$departmentName}** department.

 This Week's Data
- Entries: {$metrics['total_entries']} from {$metrics['unique_employees']}/{$metrics['total_employees']} employees
- Flagged: {$metrics['flagged_entries']}
- Sentiment: {$metrics['avg_sentiment']} ({$metrics['sentiment_label']})
- Sleep: {$metrics['avg_sleep_hours']}h avg, {$metrics['poor_sleep_count']} with <5h
- Stress: {$metrics['avg_stress']}/5 avg, {$metrics['high_stress_count']} high stress
- High-risk: {$metrics['high_risk_count']} (was {$metrics['prev_week_high_risk']}, change: {$metrics['high_risk_change']})

 High-Risk Employees
{$highRiskList}

Top Concerns
{$concernsList}
PROMPT;
    }

    private function saveInsight(int $departmentId, array $aiResponse, Carbon $startDate, Carbon $endDate): AIInsights
    {
        return AIInsights::create([
            'department_id' => $departmentId,
            'insight_type' => 'weekly_summary',
            'title' => sprintf('Weekly Wellness Summary - %s to %s', $startDate->format('M j'), $endDate->format('M j')),
            'content' => $aiResponse['formatted_report'] ?? $aiResponse['summary'] ?? '',
            'priority' => $this->determinePriority($aiResponse),
            'is_read' => false,
        ]);
    }

    private function determinePriority(array $aiResponse): string
    {
        $health = $aiResponse['metrics_analysis']['overall_health'] ?? 'healthy';
        if ($health === 'critical') return 'urgent';
        if ($health === 'concerning') return 'high';

        $hasHighPriority = collect($aiResponse['recommendations'] ?? [])
            ->contains(fn ($r) => ($r['priority'] ?? '') === 'high');
        return $hasHighPriority ? 'high' : 'normal';
    }

    private function notifyManager(int $managerId, AIInsights $insight): void
    {
        $this->notificationService->send(
            userId: $managerId,
            type: NotificationService::TYPE_WEEKLY_INSIGHT,
            title: 'Weekly Wellness Insight Ready',
            message: $insight->title . '. Tap to review team wellness summary.',
            priority: $insight->priority,
            referenceType: 'ai_insight',
            referenceId: $insight->id
        );
    }

    private function emptyMetrics(): array
    {
        return [
            'total_entries' => 0, 'unique_employees' => 0, 'total_employees' => 0,
            'avg_sentiment' => 0, 'sentiment_label' => 'neutral', 'flagged_entries' => 0,
            'avg_sleep_hours' => 0, 'poor_sleep_count' => 0, 'avg_stress' => 0,
            'high_stress_count' => 0, 'high_risk_count' => 0, 'prev_week_high_risk' => 0,
            'high_risk_change' => 0, 'high_risk_employees' => [], 'top_concerns' => [],
        ];
    }
}
