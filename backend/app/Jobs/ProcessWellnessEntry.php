<?php

namespace App\Jobs;

use App\Models\WellnessEntries;
use App\Models\WellnessEntryExtraction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class ProcessWellnessEntry implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $entryId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $entry = WellnessEntries::find($this->entryId);

        if (! $entry) {
            Log::warning("Wellness entry {$this->entryId} not found for processing");
            return;
        }

        try {
            $extractedData = $this->extractDataFromText($entry->entry_text);

            WellnessEntryExtraction::create([
                'entry_id' => $entry->id,
                ...$extractedData,
            ]);

            Log::info("Successfully processed wellness entry {$this->entryId}");
        } catch (\Exception $e) {
            Log::error("Failed to process wellness entry {$this->entryId}: " . $e->getMessage());
            throw $e;
        }
    }

    private function extractDataFromText(string $text): array
    {
        $prompt = <<<PROMPT
Parse the following wellness entry text and extract structured data. Return ONLY a valid JSON object with these exact fields:

{
  "shift_duration_hours": number or null,
  "shift_type": "day"|"evening"|"night"|"rotating"|null,
  "sleep_hours_before": number or null,
  "sleep_quality_rating": 1-10 or null,
  "meals_count": integer or null,
  "meal_quality": "poor"|"adequate"|"good"|null,
  "stress_level": "low"|"medium"|"high"|"severe"|null,
  "mood_rating": 1-10 or null,
  "physical_symptoms": array of strings or null,
  "concerns_mentioned": array of strings or null,
  "parsing_confidence": 0.0-1.0
}

Entry text:
"""
{$text}
"""

Return ONLY the JSON object, no additional text.
PROMPT;

        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a data extraction assistant. Return only valid JSON.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.3,
        ]);

        $content = $response->choices[0]->message->content;

        // Clean the response in case it's wrapped in markdown
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*$/', '', $content);
        $content = trim($content);

        $extracted = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Failed to parse OpenAI response as JSON: ' . json_last_error_msg());
        }

        return $extracted;
    }
}
