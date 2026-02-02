<?php

namespace App\Services;

use App\Prompts\WellnessSearchAnalystPrompt;
use App\Models\User;
use App\Models\WellnessEntries;
use OpenAI\Laravel\Facades\OpenAI;

class WellnessSearchService
{
    private const DEFAULT_SEARCH_LIMIT = 5;

    private const DEFAULT_SCORE_THRESHOLD = 0.03;

    private const DEFAULT_PREVIEW_LENGTH = 150;

    private const OPENAI_CHAT_MODEL = 'gpt-4o-mini';

    private const OPENAI_TEMPERATURE = 0.3;

    private const OPENAI_MAX_TOKENS = 1500;

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
        $dateRange = $this->detectDateRange($query);

        if ($dateRange) {
            $dateEntries = $this->fetchEntriesInDateRange($employeeId, $dateRange, $limit * 3);
            $queryEmbedding = $this->embeddingService->generateEmbedding($query);
            $searchResults = $this->qdrantService->search($queryEmbedding, $limit * 2, $employeeId, $scoreThreshold);
            $enriched = $this->enrichSearchResults($searchResults, $query);
            $enriched = $this->filterByDateRange($enriched, $dateRange);
            $enriched = $this->mergeAndDeduplicate($dateEntries, $enriched);
        } else {
            $queryEmbedding = $this->embeddingService->generateEmbedding($query);
            $searchResults = $this->qdrantService->search($queryEmbedding, $limit * 2, $employeeId, $scoreThreshold);
            $enriched = $this->enrichSearchResults($searchResults, $query);
        }

        $enriched = $this->reRankResults($enriched, $query);

        return array_slice($enriched, 0, $limit);
    }

    private function detectDateRange(string $query): ?array
    {
        $queryLower = strtolower($query);

        if (str_contains($queryLower, 'today')) {
            return [
                'start' => today()->startOfDay(),
                'end' => today()->endOfDay(),
                'type' => 'today',
            ];
        }

        if (str_contains($queryLower, 'this week') || str_contains($queryLower, 'week')) {
            return [
                'start' => now()->startOfWeek(),
                'end' => now()->endOfWeek(),
                'type' => 'week',
            ];
        }

        if (str_contains($queryLower, 'recent') || str_contains($queryLower, 'lately')) {
            return [
                'start' => now()->subDays(7)->startOfDay(),
                'end' => now()->endOfDay(),
                'type' => 'recent',
            ];
        }

        if (str_contains($queryLower, 'last week')) {
            return [
                'start' => now()->subWeek()->startOfWeek(),
                'end' => now()->subWeek()->endOfWeek(),
                'type' => 'last_week',
            ];
        }

        return null;
    }

    private function fetchEntriesInDateRange(?int $employeeId, array $dateRange, int $limit = self::DEFAULT_SEARCH_LIMIT): array
    {
        $builder = WellnessEntries::query()
            ->with('employee')
            ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']])
            ->orderByDesc('created_at');

        if ($employeeId !== null) {
            $builder->where('employee_id', $employeeId);
        }

        $entries = $builder->limit($limit)->get();
        $employeeNames = $this->fetchEmployeeNames($entries);

        $results = [];
        foreach ($entries as $entry) {
            $results[] = [
                'id' => $entry->id,
                'score' => 1.0,
                'entry_id' => $entry->id,
                'employee_id' => $entry->employee_id,
                'employee_name' => $employeeNames[$entry->employee_id] ?? $entry->employee->full_name ?? "Employee #{$entry->employee_id}",
                'entry_date' => $entry->created_at->format('M j'),
                'created_at' => $entry->created_at,
                'content' => $entry->entry_text,
                'snippet' => $this->formatPreview($entry->entry_text),
                'sentiment_label' => null,
                'sentiment_score' => null,
                'is_flagged' => false,
                'keywords' => [],
                'payload' => [],
            ];
        }

        return $results;
    }

    private function filterByDateRange(array $results, array $dateRange): array
    {
        return array_filter($results, function ($result) use ($dateRange) {
            if (isset($result['created_at'])) {
                $entryDate = $result['created_at'];

                return $entryDate >= $dateRange['start'] && $entryDate <= $dateRange['end'];
            }

            if (isset($result['entry_date'])) {
                try {
                    $entryDate = \Carbon\Carbon::parse($result['entry_date'] . ' ' . now()->year);

                    return $entryDate >= $dateRange['start'] && $entryDate <= $dateRange['end'];
                } catch (\Exception $e) {
                    return false;
                }
            }

            return false;
        });
    }

    private function mergeAndDeduplicate(array $vecResults, array $dbResults): array
    {
        $merged = array_merge($vecResults, $dbResults);
        $seen = [];
        $deduped = [];

        foreach ($merged as $result) {
            if (! in_array($result['entry_id'], $seen)) {
                $deduped[] = $result;
                $seen[] = $result['entry_id'];
            }
        }

        usort($deduped, function ($a, $b) {
            $scoreA = $a['score'] ?? 0;
            $scoreB = $b['score'] ?? 0;

            if ($scoreA != $scoreB) {
                return $scoreB <=> $scoreA;
            }

            return strtotime($b['entry_date'] ?? '1970-01-01') <=> strtotime($a['entry_date'] ?? '1970-01-01');
        });

        return $deduped;
    }

    private function reRankResults(array $results, string $query): array
    {
        $queryLower = strtolower($query);
        $queryKeywords = $this->extractKeywordsFromQuery($queryLower);

        $isFlagQuery = str_contains($queryLower, 'concern') || str_contains($queryLower, 'flag') || str_contains($queryLower, 'issue') || str_contains($queryLower, 'problem');
        $isSentimentQuery = str_contains($queryLower, 'positive') || str_contains($queryLower, 'negative') || str_contains($queryLower, 'sentiment') || str_contains($queryLower, 'mood');
        $isRecentQuery = str_contains($queryLower, 'today') || str_contains($queryLower, 'recent') || str_contains($queryLower, 'latest') || str_contains($queryLower, 'this week');

        foreach ($results as &$result) {
            $boost = 0;

            if ($isFlagQuery && ($result['is_flagged'] ?? false)) {
                $boost += 0.3;
            }

            if ($isSentimentQuery && ($result['sentiment_label'] === 'negative')) {
                $boost += 0.2;
            }

            if ($isSentimentQuery && ($result['sentiment_label'] === 'positive')) {
                $boost += 0.15;
            }

            if ($isRecentQuery) {
                $daysOld = (int) floor((time() - strtotime($result['entry_date'])) / 86400);
                $recencyBoost = max(0, 0.25 * (1 - ($daysOld / 30)));
                $boost += $recencyBoost;
            }

            $keywordMatch = $this->countMatchingKeywords(
                $result['keywords'] ?? [],
                $queryKeywords
            );
            if ($keywordMatch > 0) {
                $boost += min(0.2, $keywordMatch * 0.05);
            }

            $result['final_score'] = ($result['score'] ?? 0) + $boost;
        }

        usort($results, function ($a, $b) {
            return ($b['final_score'] ?? 0) <=> ($a['final_score'] ?? 0);
        });

        return $results;
    }

    private function extractKeywordsFromQuery(string $queryLower): array
    {
        $stopwords = ['what', 'are', 'the', 'is', 'how', 'why', 'when', 'where', 'which', 'if', 'for', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'from', 'of', 'about', 'with', 'me', 'show', 'find', 'get', 'all'];

        $words = preg_split('/\W+/', $queryLower, -1, PREG_SPLIT_NO_EMPTY);
        $keywords = array_filter($words, fn($w) => ! in_array($w, $stopwords) && strlen($w) > 2);

        return array_values($keywords);
    }

    private function countMatchingKeywords(array $entryKeywords, array $queryKeywords): int
    {
        if (empty($queryKeywords) || empty($entryKeywords)) {
            return 0;
        }

        $count = 0;
        foreach ($queryKeywords as $qkw) {
            foreach ($entryKeywords as $ekw) {
                if (stripos($ekw, $qkw) !== false || stripos($qkw, $ekw) !== false) {
                    $count++;
                    break;
                }
            }
        }

        return $count;
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

            if (! $entry) {
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
        $sentimentLabel = $result['payload']['sentiment_label'] ?? null;
        $sentimentScore = $result['payload']['sentiment_score'] ?? null;

        return [
            'id' => $result['id'],
            'score' => round($result['score'] ?? 0, 3),
            'final_score' => round($result['final_score'] ?? $result['score'] ?? 0, 3),
            'entry_id' => $entry->id,
            'employee_id' => $entry->employee_id,
            'employee_name' => $employeeName,
            'entry_date' => $entry->created_at->format('M j'),
            'created_at' => $entry->created_at,
            'content' => $entry->entry_text,
            'snippet' => $snippet,
            'sentiment_label' => $sentimentLabel,
            'sentiment_score' => $sentimentScore,
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
        $sentences = preg_split('/[.!?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $sentences = array_map('trim', $sentences);
        $sentences = array_filter($sentences);

        if (empty($keywords) || empty($sentences)) {
            return $this->formatPreview($text);
        }

        $scoredSentences = $this->scoreSentencesByKeywords($sentences, $keywords);

        if (empty($scoredSentences)) {
            return $this->formatPreview($text);
        }

        usort($scoredSentences, fn($a, $b) => $b['score'] - $a['score']);
        $bestSentenceIdx = $scoredSentences[0]['index'];

        $contextStart = max(0, $bestSentenceIdx - 1);
        $contextEnd = min(count($sentences) - 1, $bestSentenceIdx + 1);
        $contextSnippet = implode(' ', array_slice($sentences, $contextStart, $contextEnd - $contextStart + 1));

        return $this->formatPreview($contextSnippet);
    }

    private function scoreSentencesByKeywords(array $sentences, array $keywords): array
    {
        $scored = [];

        foreach ($sentences as $idx => $sentence) {
            $sentence = trim($sentence);
            if (empty($sentence)) {
                continue;
            }

            $score = $this->countKeywordMatches($sentence, $keywords);

            if ($score > 0) {
                $scored[] = ['sentence' => $sentence, 'score' => $score, 'index' => $idx];
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

    private function callOpenAIChat(string $query, string $context, array $sources): string
    {
        $sourcesText = $this->formatSourcesForPrompt($sources);
        $userPrompt = WellnessSearchAnalystPrompt::buildUserPrompt($query, $sourcesText, $context);

        $response = OpenAI::chat()->create([
            'model' => self::OPENAI_CHAT_MODEL,
            'messages' => [
                ['role' => 'system', 'content' => WellnessSearchAnalystPrompt::getSystemPrompt()],
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
                "[%d] %s (%s) — relevance: %.3f, sentiment: %s\n",
                $source['citation_number'],
                $source['employee_name'],
                $source['entry_date'],
                (float) ($source['score'] ?? 0),
                $source['sentiment'] ?? 'unknown'
            );
        }

        return $formatted;
    }
}
