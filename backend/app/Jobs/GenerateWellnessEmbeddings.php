<?php

namespace App\Jobs;

use App\Models\WellnessEntries;
use App\Models\WellnessEntryVector;
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
        QdrantService $qdrantService
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

            // Save data to database with Qdrant reference
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
        } catch (Exception $e) {
            Log::error(
                "Failed to generate embeddings for wellness entry {$this->entryId}: {$e->getMessage()}"
            );
            throw $e;
        }
    }
}
