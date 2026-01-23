<?php

namespace App\Jobs;

use App\Models\Employee_Department;
use App\Models\FatigueScore;
use App\Models\User;
use App\Models\WellnessEntries;
use App\Models\WellnessEntryExtraction;
use App\Models\WellnessEntryVector;
use App\Services\NotificationService;
use App\Services\QdrantService;
use App\Services\WellnessEmbeddingService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

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
            $storedPoint = false;

            $qdrantService->ensureCollection();
            $vector = $embeddingService->generateEmbedding($entry->entry_text);
            $sentiment = $embeddingService->extractSentiment($entry->entry_text);

            $sentimentScore = is_array($sentiment['sentiment_score'])
                ? (float) ($sentiment['sentiment_score'][0] ?? 0)
                : (float) $sentiment['sentiment_score'];

            $flagging = $embeddingService->shouldFlag(
                $entry->id,
                $sentimentScore,
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
            $storedPoint = true;

            DB::transaction(function () use ($entry, $sentiment, $flagging, $embeddingService) {
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

                $embeddingService->calculateFatigueScore(
                    $entry->employee_id,
                    $entry->created_at->format('Y-m-d')
                );
            });

            if ($flagging['is_flagged']) {
                $this->notifyManagerOfFlaggedEntry($entry, $flagging, $notificationService);
            }

            $this->notifyEmployeeIfHighRisk($entry->employee_id, $notificationService);
        } catch (Exception $e) {
            $employeeId = $entry->employee_id;

            try {
                if (isset($storedPoint) && $storedPoint) {
                    $qdrantService->deletePoint($entry->id);
                }
                WellnessEntryVector::where('entry_id', $entry->id)->delete();
                FatigueScore::where('employee_id', $entry->employee_id)
                    ->where('score_date', $entry->created_at->format('Y-m-d'))
                    ->delete();
                WellnessEntryExtraction::where('entry_id', $entry->id)->delete();
                WellnessEntries::where('id', $entry->id)->delete();
                $this->notifyEmployeeOfProcessingFailure($employeeId, $notificationService);
            } catch (Exception $cleanupException) {
                throw $cleanupException;
            }

            throw $e;
        }
    }

    private function notifyManagerOfFlaggedEntry(
        WellnessEntries $entry,
        array $flagging,
        NotificationService $notificationService
    ): void {
        $employee = User::find($entry->employee_id);
        if (! $employee) {
            return;
        }
        $departments = Employee_Department::where('employee_id', $entry->employee_id)->get();

        foreach ($departments as $dept) {
            $managers = User::whereHas('employeeDepartments', function ($q) use ($dept) {
                $q->where('department_id', $dept->department_id);
            })->whereHas('userType', function ($q) {
                $q->where('role_name', 'manager');
            })->get();

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

        if (! $score || $score->risk_level !== 'high') {
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

    private function notifyEmployeeOfProcessingFailure(
        int $employeeId,
        NotificationService $notificationService
    ): void {
        $employee = User::find($employeeId);
        if (! $employee) {
            return;
        }

        $notificationService->send(
            $employeeId,
            NotificationService::TYPE_WELLNESS_ALERT,
            'Wellness Entry Processing Failed',
            'We encountered an error while processing your wellness entry. Please try submitting your entry again.',
            'high',
            'wellness_entry',
            null
        );
    }
}
