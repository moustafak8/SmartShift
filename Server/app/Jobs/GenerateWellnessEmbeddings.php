<?php

namespace App\Jobs;

use App\Models\Employee_Department;
use App\Models\FatigueScore;
use App\Models\User;
use App\Models\WellnessEntries;
use App\Models\WellnessEntryVector;
use App\Services\NotificationService;
use App\Services\QdrantService;
use App\Services\WellnessEmbeddingService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateWellnessEmbeddings implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $entryId
    ) {}

    public function handle(
        WellnessEmbeddingService $embeddingService,
        QdrantService $qdrantService,
        NotificationService $notificationService
    ): void {
        $entry = WellnessEntries::find($this->entryId);

        if (! $entry) {
            return;
        }

        try {
            $qdrantService->ensureCollection();
            $vector = $embeddingService->generateEmbedding($entry->entry_text);
            $sentiment = $embeddingService->extractSentiment($entry->entry_text);
            $flagging = $embeddingService->shouldFlag(
                $entry->id,
                $sentiment['sentiment_score'],
                $sentiment['detected_keywords']
            );
            $payload = [
                'entry_id' => $entry->id,
                'employee_id' => $entry->employee_id,
                'is_private' => $entry->is_private,
                'sentiment_label' => $sentiment['sentiment_label'],
                'sentiment_score' => $sentiment['sentiment_score'],
                'keywords' => $sentiment['detected_keywords'],
                'is_flagged' => $flagging['is_flagged'],
            ];

            $qdrantService->storeVector($entry->id, $vector, $payload);

          
            WellnessEntryVector::updateOrCreate(
                ['entry_id' => $entry->id],
                [
                    'qdrant_point_id' => (string) $entry->id,
                    'sentiment_score' => $sentiment['sentiment_score'],
                    'sentiment_label' => $sentiment['sentiment_label'],
                    'detected_keywords' => $sentiment['detected_keywords'],
                    'is_flagged' => $flagging['is_flagged'],
                    'flag_reason' => $flagging['flag_reason'] ?? null,
                    'flag_severity' => $flagging['flag_severity'] ?? null,
                ]
            );

            if ($flagging['is_flagged']) {
                $this->notifyManagerOfFlaggedEntry($entry, $flagging, $notificationService);
            }

            $embeddingService->calculateFatigueScore(
                $entry->employee_id,
                $entry->created_at->format('Y-m-d')
            );

          
            $this->notifyEmployeeIfHighRisk($entry->employee_id, $notificationService);
        } catch (Exception $e) {
            Log::error(
                "Failed to generate embeddings for wellness entry {$this->entryId}: {$e->getMessage()}"
            );
            throw $e;
        }
    }

    private function notifyManagerOfFlaggedEntry(
        WellnessEntries $entry,
        array $flagging,
        NotificationService $notificationService
    ): void {
        $employee = User::find($entry->employee_id);
        if (!$employee) {
            return;
        }
        $departments = Employee_Department::where('employee_id', $entry->employee_id)->get();

        foreach ($departments as $dept) {
            $managers = User::whereHas('employeeDepartments', function ($q) use ($dept) {
                $q->where('department_id', $dept->department_id);
            })->where('role', 'manager')->get();

            foreach ($managers as $manager) {
                $severity = $flagging['flag_severity'] ?? 'medium';
                $priority = $severity === 'critical' ? 'high' : 'normal';

                $notificationService->send(
                    $manager->id,
                    NotificationService::TYPE_WELLNESS_ALERT,
                    "Wellness Alert: {$employee->full_name}",
                    "{$employee->full_name}'s wellness entry flagged as {$severity}. {$flagging['flag_reason']}",
                    $priority,
                    'wellness_entry',
                    $entry->id
                );
            }
        }
    }

    private function notifyEmployeeIfHighRisk(
        int $employeeId,
        NotificationService $notificationService
    ): void {
        $score = FatigueScore::where('employee_id', $employeeId)
            ->orderByDesc('score_date')
            ->first();

        if (!$score || $score->risk_level !== 'high') {
            return;
        }

        $notificationService->send(
            $employeeId,
            NotificationService::TYPE_FATIGUE_WARNING,
            'Fatigue Score Alert',
            "Your fatigue score is now {$score->total_score} (HIGH RISK). Please prioritize rest.",
            'high',
            'fatigue_score',
            $score->id
        );
    }
}
