<?php

namespace App\Prompts;

class WellnessEntryExtractionPrompt
{
    public static function getSystemPrompt(): string
    {
        return 'You are a data extraction assistant. Return only valid JSON.';
    }

    public static function buildUserPrompt(string $text, string $schemaJson): string
    {
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
}
