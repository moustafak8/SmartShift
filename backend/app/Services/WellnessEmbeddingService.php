<?php

namespace App\Services;

use App\Models\FatigueScore;
use App\Models\Shift_Assigments;
use App\Models\WellnessEntryExtraction;
use OpenAI\Laravel\Facades\OpenAI;

class WellnessEmbeddingService
{
    private const EMBEDDING_MODEL = 'text-embedding-3-small';

    private const SENTIMENT_MODEL = 'gpt-4.1';

    private const CRITICAL_KEYWORDS = ['suicide', 'harm', 'crisis', 'emergency'];

    private const CONCERNING_KEYWORDS = ['severe', 'overwhelmed', 'breakdown', 'collapse'];

    public function generateEmbedding(string $text): array
    {
        $response = OpenAI::embeddings()->create([
            'model' => self::EMBEDDING_MODEL,
            'input' => $text,
        ]);

        return $this->extractEmbeddingVector($response);
    }

    public function extractSentiment(string $text): array
    {
        $prompt = $this->buildSentimentPrompt($text);
        $response = $this->callSentimentAPI($prompt);
        $content = $this->cleanResponse($response->choices[0]->message->content);

        return $this->parseSentimentResponse($content);
    }

    public function shouldFlag(int $entryId, float $sentimentScore, array $keywords): array
    {
        $extraction = WellnessEntryExtraction::where('entry_id', $entryId)->first();

        if ($this->isCriticalCondition($extraction, $sentimentScore)) {
            return $this->buildFlagData('critical', $this->getCriticalReason($extraction, $sentimentScore));
        }

        if ($this->hasCriticalKeywords($keywords)) {
            $detected = $this->getDetectedCriticalKeywords($keywords);

            return $this->buildFlagData('critical', 'Critical keywords detected: ' . implode(', ', $detected));
        }

        if ($sentimentScore <= -0.7) {
            return $this->buildFlagData('high', 'Very negative sentiment detected');
        }

        if ($this->hasConcerningPatterns($keywords)) {
            return $this->buildFlagData('medium', 'Multiple concerning patterns detected');
        }

        return ['is_flagged' => false];
    }

    public function calculateFatigueScore(int $employeeId, string $date): void
    {
        $quantitativeScore = $this->calculateQuantitativeScore($employeeId, $date);
        $qualitativeScore = $this->calculateQualitativeScore($employeeId, $date);
        $psychologicalScore = $this->calculatePsychologicalScore($employeeId, $date);

        FatigueScore::updateOrCreate(
            ['employee_id' => $employeeId, 'score_date' => $date],
            [
                'quantitative_score' => $quantitativeScore,
                'qualitative_score' => $qualitativeScore,
                'psychological_score' => $psychologicalScore,
            ]
        );
    }

    private function isCriticalCondition($extraction, float $sentimentScore): bool
    {
        if (! $extraction) {
            return false;
        }

        $sleepDeprivation = $extraction->sleep_hours_before < 4 && $extraction->shift_duration_hours > 10;
        $multipleSymptoms = is_array($extraction->physical_symptoms) && count($extraction->physical_symptoms) >= 2;
        $highStress = $extraction->stress_level === 'high';
        $criticalSentiment = $sentimentScore <= -0.6;

        return $sleepDeprivation && ($multipleSymptoms || $highStress || $criticalSentiment);
    }

    private function getCriticalReason($extraction, float $sentimentScore): string
    {
        $reasons = [];

        if ($extraction->sleep_hours_before < 4) {
            $reasons[] = "Critical sleep deprivation ({$extraction->sleep_hours_before}h)";
        }

        if ($extraction->shift_duration_hours > 10) {
            $reasons[] = "after {$extraction->shift_duration_hours}h shift";
        }

        if (is_array($extraction->physical_symptoms) && count($extraction->physical_symptoms) >= 2) {
            $reasons[] = 'multiple symptoms';
        }

        if ($extraction->stress_level === 'high') {
            $reasons[] = 'high stress';
        }

        return implode(' + ', $reasons);
    }

    private function hasCriticalKeywords(array $keywords): bool
    {
        $detected = $this->getDetectedCriticalKeywords($keywords);

        return ! empty($detected);
    }

    private function getDetectedCriticalKeywords(array $keywords): array
    {
        return array_intersect(
            array_map('strtolower', $keywords),
            self::CRITICAL_KEYWORDS
        );
    }

    private function hasConcerningPatterns(array $keywords): bool
    {
        $detected = array_intersect(
            array_map('strtolower', $keywords),
            self::CONCERNING_KEYWORDS
        );

        return count($detected) >= 2;
    }

    private function buildFlagData(string $severity, string $reason): array
    {
        return [
            'is_flagged' => true,
            'flag_severity' => $severity,
            'flag_reason' => $reason,
        ];
    }

    private function calculateQuantitativeScore(int $employeeId, string $date): int
    {
        $totalHours = $this->getTotalHoursWorked($employeeId, $date);
        $nightShifts = $this->getNightShiftsCount($employeeId, $date);

        $hoursScore = min(20, $totalHours / 4);
        $nightScore = min(15, $nightShifts * 5);

        return (int) ($hoursScore + $nightScore);
    }

    private function calculateQualitativeScore(int $employeeId, string $date): int
    {
        $extraction = $this->getWeeklyExtractionData($employeeId, $date);

        if (! $extraction) {
            return 0;
        }

        $avgSleep = $extraction['avg_sleep'];
        $avgMeals = $extraction['avg_meals'];
        $symptomsCount = $extraction['symptoms_count'];

        $sleepScore = max(0, (7 - $avgSleep) * 3);
        $mealsScore = max(0, (3 - $avgMeals) * 2);
        $symptomsScore = min(10, $symptomsCount * 2);

        return (int) min(30, $sleepScore + $mealsScore + $symptomsScore);
    }

    private function calculatePsychologicalScore(int $employeeId, string $date): int
    {
        $sentimentData = $this->getWeeklySentimentData($employeeId, $date);

        if (! $sentimentData) {
            return 0;
        }

        $avgSentiment = $sentimentData['avg_sentiment'];
        $highStressCount = $sentimentData['high_stress_count'];

        $sentimentScore = abs($avgSentiment) * 15;
        $stressScore = min(15, $highStressCount * 3);

        return (int) min(30, $sentimentScore + $stressScore);
    }

    private function getTotalHoursWorked(int $employeeId, string $date): float
    {
        $assignments = Shift_Assigments::where('employee_id', $employeeId)
            ->whereHas('shift', function ($query) use ($date) {
                $query->whereBetween('shift_date', [
                    now()->parse($date)->subDays(6)->format('Y-m-d'),
                    $date,
                ]);
            })
            ->with('shift')
            ->get();

        return $assignments->sum(function ($assignment) {
            $shift = $assignment->shift;
            if (! $shift || ! $shift->start_time || ! $shift->end_time) {
                return 0;
            }

            return now()->parse($shift->start_time)->diffInHours(now()->parse($shift->end_time));
        });
    }

    private function getNightShiftsCount(int $employeeId, string $date): int
    {
        return Shift_Assigments::where('employee_id', $employeeId)
            ->whereHas('shift', function ($query) use ($date) {
                $query->whereBetween('shift_date', [
                    now()->parse($date)->subDays(6)->format('Y-m-d'),
                    $date,
                ])->where('shift_type', 'night');
            })
            ->count();
    }

    private function getWeeklyExtractionData(int $employeeId, string $date): ?array
    {
        $extractions = WellnessEntryExtraction::whereHas('entry', function ($query) use ($employeeId) {
            $query->where('employee_id', $employeeId);
        })
            ->whereBetween('created_at', [
                now()->parse($date)->subDays(6),
                now()->parse($date)->endOfDay(),
            ])
            ->get();

        if ($extractions->isEmpty()) {
            return null;
        }

        return [
            'avg_sleep' => $extractions->avg('sleep_hours_before'),
            'avg_meals' => $extractions->avg('meals_count'),
            'symptoms_count' => $extractions->sum(fn($e) => is_array($e->physical_symptoms) ? count($e->physical_symptoms) : 0),
        ];
    }

    private function getWeeklySentimentData(int $employeeId, string $date): ?array
    {
        $sentimentData = \App\Models\WellnessEntryVector::whereHas('entry', function ($query) use ($employeeId) {
            $query->where('employee_id', $employeeId);
        })
            ->whereBetween('created_at', [
                now()->parse($date)->subDays(6),
                now()->parse($date)->endOfDay(),
            ])
            ->get();

        $extractions = WellnessEntryExtraction::whereHas('entry', function ($query) use ($employeeId) {
            $query->where('employee_id', $employeeId);
        })
            ->whereBetween('created_at', [
                now()->parse($date)->subDays(6),
                now()->parse($date)->endOfDay(),
            ])
            ->get();

        if ($sentimentData->isEmpty()) {
            return null;
        }

        return [
            'avg_sentiment' => $sentimentData->avg('sentiment_score') ?? 0,
            'high_stress_count' => $extractions->where('stress_level', 'high')->count(),
        ];
    }

    private function buildSentimentPrompt(string $text): string
    {
        return <<<PROMPT
Analyze the sentiment of the following wellness entry and extract key information.

Entry: "$text"

Respond with JSON in this exact format:
{
  "sentiment_label": "positive|neutral|negative",
  "sentiment_score": <number between -1 and 1>,
  "detected_keywords": ["keyword1", "keyword2"]
}

Focus on emotional tone, stress indicators, and concerning language.
PROMPT;
    }

    private function callSentimentAPI(string $prompt): object
    {
        return OpenAI::chat()->create([
            'model' => self::SENTIMENT_MODEL,
            'messages' => [
                ['role' => 'system', 'content' => 'You are a sentiment analysis expert.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.3,
        ]);
    }

    private function cleanResponse(string $content): string
    {
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*$/', '', $content);

        return trim($content);
    }

    private function parseSentimentResponse(string $content): array
    {
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException(
                'Failed to parse sentiment response as JSON: ' . json_last_error_msg()
            );
        }

        if (! isset($data['sentiment_label'], $data['sentiment_score'], $data['detected_keywords'])) {
            throw new \RuntimeException('Sentiment response missing required fields');
        }

        if (! in_array($data['sentiment_label'], ['positive', 'neutral', 'negative'])) {
            $data['sentiment_label'] = 'neutral';
        }

        $data['sentiment_score'] = max(-1, min(1, (float) $data['sentiment_score']));

        $data['detected_keywords'] = is_array($data['detected_keywords'])
            ? array_map('strtolower', $data['detected_keywords'])
            : [];

        return $data;
    }

    private function extractEmbeddingVector(object $response): array
    {

        if (isset($response->data[0]->embedding)) {
            return $response->data[0]->embedding;
        }
        if (isset($response->embeddings[0]->embedding)) {
            return $response->embeddings[0]->embedding;
        }

        throw new \RuntimeException('Invalid embedding response structure');
    }
}
