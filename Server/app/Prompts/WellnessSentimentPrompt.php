<?php

namespace App\Prompts;

class WellnessSentimentPrompt
{
    public static function getSystemPrompt(): string
    {
        return 'You are a sentiment analysis expert.';
    }

    public static function buildUserPrompt(string $text): string
    {
        return <<<PROMPT
Analyze the sentiment of the following wellness entry and extract key information.

Entry: "{$text}"

Respond with JSON in this exact format:
{
  "sentiment_label": "positive|neutral|negative",
  "sentiment_score": <number between -1 and 1>,
  "detected_keywords": ["keyword1", "keyword2"]
}

Focus on emotional tone, stress indicators, and concerning language.
PROMPT;
    }
}
