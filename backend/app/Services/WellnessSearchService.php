<?php

namespace App\Services;

use App\Models\User;
use App\Models\WellnessEntries;
use OpenAI\Laravel\Facades\OpenAI;

class WellnessSearchService
{
    private const DEFAULT_SEARCH_LIMIT = 5;
    private const DEFAULT_SCORE_THRESHOLD = 0.2;
    private const DEFAULT_PREVIEW_LENGTH = 150;
    private const OPENAI_CHAT_MODEL = 'gpt-4.1';
    private const OPENAI_TEMPERATURE = 0.3;
    private const OPENAI_MAX_TOKENS = 1000;

    public function __construct(
        protected WellnessEmbeddingService $embeddingService,
        protected QdrantService $qdrantService
    ) {}

    public function search(
        string $query,
        int $limit = self::DEFAULT_SEARCH_LIMIT,
        ?int $employeeId = null,
        float $scoreThreshold = self::DEFAULT_SCORE_THRESHOLD
    ): array {
        $queryEmbedding = $this->embeddingService->generateEmbedding($query);
        $searchResults = $this->qdrantService->search($queryEmbedding, $limit, $employeeId, $scoreThreshold);

        return $this->enrichSearchResults($searchResults, $query);
    }

    public function generateResponse(string $query, ?int $employeeId = null): array
    {
        $searchResults = $this->search($query, self::DEFAULT_SEARCH_LIMIT, $employeeId, self::DEFAULT_SCORE_THRESHOLD);

        if (empty($searchResults)) {
            return [
                'query' => $query,
                'answer' => 'I could not find any relevant wellness entries to answer your question.',
                'sources' => [],
            ];
        }

        [$context, $sources] = $this->buildContextAndSources($searchResults);
        $answer = $this->callOpenAIChat($query, $context, $sources);

        return [
            'query' => $query,
            'answer' => trim($answer),
            'sources' => $sources,
        ];
    }
    private function enrichSearchResults(array $results, string $query): array
    {
        if (empty($results)) {
            return [];
        }

        $entryIds = array_column($results, 'id');
        $entries = $this->fetchEntries($entryIds);
        $employeeNames = $this->fetchEmployeeNames($entries);

        $enriched = [];
        foreach ($results as $result) {
            $entry = $entries->get($result['id']);

            if (!$entry || !$this->isResultRelevant($query, $entry->entry_text, $result['payload'] ?? [])) {
                continue;
            }

            $enriched[] = $this->buildEnrichedResult($result, $entry, $employeeNames);
        }

        return $enriched;
    }

    private function fetchEntries(array $entryIds)
    {
        return WellnessEntries::with('employee')
            ->whereIn('id', $entryIds)
            ->get()
            ->keyBy('id');
    }

    private function fetchEmployeeNames($entries)
    {
        $employeeIds = $entries->pluck('employee_id')->filter()->unique()->all();

        if (empty($employeeIds)) {
            return collect();
        }

        return User::whereIn('id', $employeeIds)->pluck('full_name', 'id');
    }

    private function buildEnrichedResult(array $result, $entry, $employeeNames): array
    {
        $employeeName = $this->getEmployeeName($entry, $result, $employeeNames);
        $snippet = $this->extractRelevantSnippet($entry->entry_text, $result['payload']['keywords'] ?? []);

        return [
            'id' => $result['id'],
            'score' => round($result['score'] ?? 0, 3),
            'entry_id' => $entry->id,
            'employee_id' => $entry->employee_id,
            'employee_name' => $employeeName,
            'entry_date' => $entry->created_at->format('M j'),
            'content' => $entry->entry_text,
            'snippet' => $snippet,
            'sentiment_label' => $result['payload']['sentiment_label'] ?? null,
            'sentiment_score' => $result['payload']['sentiment_score'] ?? null,
            'is_flagged' => $result['payload']['is_flagged'] ?? false,
            'keywords' => $result['payload']['keywords'] ?? [],
        ];
    }

    private function getEmployeeName($entry, array $result, $employeeNames): string
    {
        return $employeeNames[$entry->employee_id]
            ?? $entry->employee->name
            ?? $result['payload']['employee_name']
            ?? ('Employee #' . $entry->employee_id);
    }
    private function extractRelevantSnippet(string $text, array $keywords): string
    {
        if (empty($keywords)) {
            return $this->formatPreview($text);
        }

        $sentences = preg_split('/[.!?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $scoredSentences = $this->scoreSentencesByKeywords($sentences, $keywords);

        if (empty($scoredSentences)) {
            return $this->formatPreview($text);
        }

        usort($scoredSentences, fn($a, $b) => $b['score'] - $a['score']);
        return $this->formatPreview($scoredSentences[0]['sentence']);
    }

    private function scoreSentencesByKeywords(array $sentences, array $keywords): array
    {
        $scored = [];

        foreach ($sentences as $sentence) {
            $sentence = trim($sentence);
            if (empty($sentence)) {
                continue;
            }

            $score = $this->countKeywordMatches($sentence, $keywords);

            if ($score > 0) {
                $scored[] = ['sentence' => $sentence, 'score' => $score];
            }
        }

        return $scored;
    }

    private function countKeywordMatches(string $sentence, array $keywords): int
    {
        $sentenceLower = strtolower($sentence);
        $score = 0;

        foreach ($keywords as $keyword) {
            if (stripos($sentenceLower, $keyword) !== false) {
                $score++;
            }
        }

        return $score;
    }
    private function formatPreview(string $content): string
    {
        $preview = trim($content);

        if (mb_strlen($preview) <= self::DEFAULT_PREVIEW_LENGTH) {
            return $preview;
        }

        $preview = mb_substr($preview, 0, self::DEFAULT_PREVIEW_LENGTH);
        $lastPeriod = mb_strrpos($preview, '.');
        $lastSpace = mb_strrpos($preview, ' ');

        if ($lastPeriod !== false && $lastPeriod > self::DEFAULT_PREVIEW_LENGTH * 0.5) {
            return mb_substr($preview, 0, $lastPeriod + 1);
        }

        if ($lastSpace !== false) {
            return mb_substr($preview, 0, $lastSpace) . '...';
        }

        return $preview . '...';
    }

    private function buildContextAndSources(array $searchResults): array
    {
        $context = '';
        $sources = [];

        foreach ($searchResults as $index => $result) {
            $context .= $result['content'] . "\n\n";
            $sources[] = $this->buildSource($result, $index + 1);
        }

        return [$context, $sources];
    }

    private function buildSource(array $result, int $citationNumber): array
    {
        return [
            'entry_id' => $result['entry_id'],
            'citation_number' => $citationNumber,
            'citation' => $this->formatCitation($result['employee_name'], $result['entry_date'], $citationNumber),
            'employee_name' => $result['employee_name'],
            'entry_date' => $result['entry_date'],
            'score' => $result['score'],
            'preview' => $result['snippet'],
            'sentiment' => $result['sentiment_label'],
            'is_flagged' => $result['is_flagged'],
        ];
    }

    private function formatCitation(string $employeeName, string $entryDate, int $citationNumber): string
    {
        return sprintf('[%d] %s (%s)', $citationNumber, $employeeName, $entryDate);
    }
    private function isResultRelevant(string $query, string $content, array $payload = []): bool
    {
        $queryLower = strtolower($query);
        $contentLower = strtolower($content);

        $constraint = $this->parseSleepConstraint($queryLower);
        if ($constraint !== null) {
            $hours = $this->extractHoursFromText($contentLower);
            return !empty($hours) && $this->matchesNumericConstraint($hours, $constraint);
        }

        $queryKeywords = $this->extractQueryKeywords($queryLower);
        if (!empty($queryKeywords)) {
            return $this->hasKeywordMatch($queryKeywords, $contentLower, $payload);
        }

        return true;
    }

    private function hasKeywordMatch(array $keywords, string $content, array $payload): bool
    {
        $payloadKeywords = array_map('strtolower', $payload['keywords'] ?? []);

        foreach ($keywords as $kw) {
            if (str_contains($content, $kw) || in_array($kw, $payloadKeywords, true)) {
                return true;
            }
        }

        return false;
    }
    private function parseSleepConstraint(string $q): ?array
    {
        $q = preg_replace('/\s+/', ' ', $q);

        if (!preg_match('/(\d+(?:\.\d+)?)/', $q, $m)) {
            return null;
        }

        $num = (float)$m[1];
        $hasSleep = str_contains($q, 'sleep') || str_contains($q, 'slept') || str_contains($q, 'hours');

        if (!$hasSleep) {
            return null;
        }

        if (str_contains($q, 'less than') || str_contains($q, 'under') || str_contains($q, 'below')) {
            return ['op' => 'lt', 'value' => $num];
        }
        if (str_contains($q, 'more than') || str_contains($q, 'over') || str_contains($q, 'above')) {
            return ['op' => 'gt', 'value' => $num];
        }
        if (str_contains($q, 'at least') || str_contains($q, 'minimum') || str_contains($q, '>=')) {
            return ['op' => 'gte', 'value' => $num];
        }
        if (str_contains($q, 'at most') || str_contains($q, 'maximum') || str_contains($q, '<=')) {
            return ['op' => 'lte', 'value' => $num];
        }
        if (str_contains($q, 'sleep of') || str_contains($q, 'slept for') || str_contains($q, 'got') || str_contains($q, 'exactly')) {
            return ['op' => 'eq', 'value' => $num];
        }

        return ['op' => 'eq', 'value' => $num];
    }

    private function extractHoursFromText(string $text): array
    {
        preg_match_all('/(\d+(?:\.\d+)?)\s*(hours|hour|hrs|hr|h)/i', $text, $matches);

        if (empty($matches[1])) {
            return [];
        }

        return array_map('floatval', $matches[1]);
    }

    private function matchesNumericConstraint(array $values, array $constraint): bool
    {
        $op = $constraint['op'];
        $target = (float)$constraint['value'];
        $eps = 0.25;

        foreach ($values as $v) {
            switch ($op) {
                case 'lt':
                    if ($v < $target) return true;
                    break;
                case 'lte':
                    if ($v <= $target) return true;
                    break;
                case 'gt':
                    if ($v > $target) return true;
                    break;
                case 'gte':
                    if ($v >= $target) return true;
                    break;
                case 'eq':
                    if (abs($v - $target) <= $eps) return true;
                    break;
            }
        }

        return false;
    }

    private function extractQueryKeywords(string $q): array
    {
        $q = preg_replace('/\d+(?:\.\d+)?/', ' ', $q);
        $parts = preg_split('/[^a-z]+/i', $q, -1, PREG_SPLIT_NO_EMPTY);

        $stop = [
            'who',
            'got',
            'get',
            'of',
            'for',
            'the',
            'a',
            'an',
            'is',
            'are',
            'was',
            'were',
            'to',
            'in',
            'on',
            'at',
            'with',
            'and',
            'or',
            'than',
            'less',
            'more',
            'under',
            'over',
            'below',
            'above',
            'least',
            'most',
            'exactly',
            'sleep',
            'slept',
            'hours',
            'hour',
            'hrs',
            'hr',
            'h',
            'before',
            'their',
            'shift',
            'any',
            'entries',
            'entry',
            'employee',
            'employees',
            'wellness'
        ];

        $out = [];
        foreach ($parts as $p) {
            $pl = strtolower($p);
            if (strlen($pl) > 2 && !in_array($pl, $stop, true)) {
                $out[] = $pl;
            }
        }

        return array_values(array_unique($out));
    }

    private function callOpenAIChat(string $query, string $context, array $sources): string
    {
        $systemPrompt = "You are a helpful HR wellness analyst. " .
            "Answer questions about employee wellness entries based ONLY on the provided context. " .
            "Provide comprehensive, detailed answers that include relevant contextual information from the wellness entries. " .
            "Always cite your sources using [1], [2], etc. corresponding to the provided sources. " .
            "Include specific details like dates, times, and situations mentioned in the entries. " .
            "Format the answer as a natural, flowing response that addresses the query thoroughly.";

        $sourcesText = $this->formatSourcesForPrompt($sources);
        $userPrompt = "Sources:\n{$sourcesText}\n\nContext from Wellness Entries:\n{$context}\n\nQuestion: {$query}\n\nProvide a detailed, comprehensive answer using the sources above. Always cite which source each piece of information comes from using [1], [2], etc.";

        $response = OpenAI::chat()->create([
            'model' => self::OPENAI_CHAT_MODEL,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => self::OPENAI_TEMPERATURE,
            'max_tokens' => self::OPENAI_MAX_TOKENS,
        ]);

        return $response->choices[0]->message->content ?? 'No response generated.';
    }

    private function formatSourcesForPrompt(array $sources): string
    {
        $formatted = '';
        foreach ($sources as $source) {
            $formatted .= sprintf(
                "[%d] %s (%s)\n",
                $source['citation_number'],
                $source['employee_name'],
                $source['entry_date']
            );
        }
        return $formatted;
    }
}
