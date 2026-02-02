<?php

namespace App\Prompts;

class InsightSystemPrompt
{
    public static function getSystemPrompt(): string
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

    public static function buildUserPrompt(array $metrics, string $departmentName): string
    {
        $highRiskList = collect($metrics['high_risk_employees'])
            ->map(fn($e) => "- Employee #{$e['employee_id']}: Score {$e['score']} ({$e['risk_level']} risk)")
            ->implode("\n");

        $concernsList = collect($metrics['top_concerns'])
            ->map(fn($count, $concern) => "- {$concern}: {$count} mentions")
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
}
