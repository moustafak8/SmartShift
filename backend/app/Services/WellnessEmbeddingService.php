<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;

class WellnessEmbeddingService
{
    private const EMBEDDING_MODEL = 'text-embedding-3-small';

    private const SENTIMENT_MODEL = 'gpt-4o-mini';

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
        $prompt = <<<PROMPT
Analyze the sentiment of this wellness entry. Return a JSON object with exactly these fields:

{
  "sentiment_label": "positive"|"neutral"|"negative",
  "sentiment_score": -1.0 to 1.0,
  "detected_keywords": array of strings
}

Wellness entry:
"{$text}"

Return ONLY the JSON object, no additional text.
PROMPT;

        $response = OpenAI::chat()->create([
            'model' => self::SENTIMENT_MODEL,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a wellness sentiment analyzer. Return only valid JSON with sentiment_label, sentiment_score (-1 to 1), and detected_keywords array.',
                ],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.3,
        ]);

        $content = $this->cleanResponse($response->choices[0]->message->content);

        return $this->parseSentimentResponse($content);
    }

    public function shouldFlag(float $sentimentScore, array $keywords): array
    {

        if ($sentimentScore <= -0.7) {
            return [
                'is_flagged' => true,
                'flag_severity' => 'high',
                'flag_reason' => 'Very negative sentiment detected',
            ];
        }

        $criticalKeywords = ['suicide', 'harm', 'crisis', 'emergency'];
        $detectedCritical = array_intersect(array_map('strtolower', $keywords), $criticalKeywords);

        if (! empty($detectedCritical)) {
            return [
                'is_flagged' => true,
                'flag_severity' => 'critical',
                'flag_reason' => 'Critical keywords detected: '.implode(', ', $detectedCritical),
            ];
        }

        $concerningKeywords = ['severe', 'overwhelmed', 'breakdown', 'collapse'];
        $detectedConcerning = array_intersect(array_map('strtolower', $keywords), $concerningKeywords);

        if (count($detectedConcerning) >= 2) {
            return [
                'is_flagged' => true,
                'flag_severity' => 'medium',
                'flag_reason' => 'Multiple concerning patterns detected',
            ];
        }

        return [
            'is_flagged' => false,
        ];
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
                'Failed to parse sentiment response as JSON: '.json_last_error_msg()
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
