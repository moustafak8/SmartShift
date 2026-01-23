<?php

namespace App\Jobs;

use App\Models\WellnessEntries;
use App\Models\WellnessEntryExtraction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use OpenAI\Laravel\Facades\OpenAI;

class ProcessWellnessEntry implements ShouldQueue
{
    use Queueable;

    private const OPENAI_MODEL = 'gpt-4o-mini';

    private const TEMPERATURE = 0.3;

    private const EXTRACTION_SCHEMA = [
        'shift_duration_hours' => 'number or null',
        'shift_type' => '"day"|"evening"|"night"|"rotating"|null',
        'sleep_hours_before' => 'number or null',
        'sleep_quality_rating' => '1-10 or null',
        'meals_count' => 'integer or null',
        'meal_quality' => '"poor"|"adequate"|"good"|null',
        'stress_level' => '"low"|"medium"|"high"|"severe"|null',
        'mood_rating' => '1-10 or null',
        'physical_symptoms' => 'array of strings or null',
        'concerns_mentioned' => 'array of strings or null',
        'parsing_confidence' => '0.0-1.0',
    ];

    public function __construct(
        public int $entryId
    ) {}

    public function handle(): void
    {
        $entry = $this->getWellnessEntry();

        if (! $entry) {
            return;
        }

        try {
            $extractedData = $this->extractDataFromText($entry->entry_text);

            $this->saveExtraction($entry->id, $extractedData);

            GenerateWellnessEmbeddings::dispatch($entry->id);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    private function getWellnessEntry(): ?WellnessEntries
    {
        $entry = WellnessEntries::find($this->entryId);

        return $entry;
    }

    private function extractDataFromText(string $text): array
    {
        $response = $this->callOpenAI($text);

        $content = $this->cleanResponse($response->choices[0]->message->content);

        return $this->parseJsonResponse($content);
    }

    private function callOpenAI(string $text): object
    {
        return OpenAI::chat()->create([
            'model' => self::OPENAI_MODEL,
            'messages' => [
                ['role' => 'system', 'content' => 'You are a data extraction assistant. Return only valid JSON.'],
                ['role' => 'user', 'content' => $this->buildPrompt($text)],
            ],
            'temperature' => self::TEMPERATURE,
        ]);
    }

    private function buildPrompt(string $text): string
    {
        $schemaJson = $this->formatSchema();

        return <<<PROMPT
        Parse the following wellness entry text and extract structured data. Return ONLY a valid JSON object with these exact fields:

        {$schemaJson}

        Entry text:
        """
        {$text}
        """

        Return ONLY the JSON object, no additional text.
        PROMPT;
    }

    private function formatSchema(): string
    {
        $fields = array_map(
            fn ($key, $type) => "  \"{$key}\": {$type}",
            array_keys(self::EXTRACTION_SCHEMA),
            self::EXTRACTION_SCHEMA
        );

        return "{\n".implode(",\n", $fields)."\n}";
    }

    private function cleanResponse(string $content): string
    {
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*$/', '', $content);

        return trim($content);
    }

    private function parseJsonResponse(string $content): array
    {
        $extracted = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Failed to parse OpenAI response as JSON: '.json_last_error_msg());
        }

        return $extracted;
    }

    private function saveExtraction(int $entryId, array $data): void
    {
        WellnessEntryExtraction::create([
            'entry_id' => $entryId,
            ...$data,
        ]);
    }
}
