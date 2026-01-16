<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class QdrantService
{
    private const DEFAULT_COLLECTION_NAME = 'wellness_entries';

    private const DEFAULT_VECTOR_DIMENSION = 1536;

    private const DEFAULT_SEARCH_LIMIT = 5;

    private const DEFAULT_SCORE_THRESHOLD = 0.2;

    private const HTTP_TIMEOUT = 30;

    protected string $qdrantUrl;

    protected string $collectionName;

    protected int $vectorDimension;

    public function __construct(
        string $collectionName = self::DEFAULT_COLLECTION_NAME,
        int $vectorDimension = self::DEFAULT_VECTOR_DIMENSION
    ) {
        $this->qdrantUrl = rtrim(config('services.qdrant.url', 'http://localhost:6333'), '/');
        $this->collectionName = $collectionName;
        $this->vectorDimension = $vectorDimension;
    }

    public function storeVector(int $entryId, array $vector, array $payload): void
    {
        if (empty($vector)) {
            throw new Exception('Invalid vector: must be non-empty array');
        }
        $vector = array_map('floatval', $vector);

        $this->httpPut(
            "/collections/{$this->collectionName}/points",
            [
                'points' => [
                    [
                        'id' => $entryId,
                        'vector' => $vector,
                        'payload' => $payload,
                    ],
                ],
            ],
            'Qdrant upsert failed'
        );
    }

    public function search(
        array $vector,
        int $limit = self::DEFAULT_SEARCH_LIMIT,
        ?int $employeeId = null,
        float $scoreThreshold = self::DEFAULT_SCORE_THRESHOLD
    ): array {
        if (count($vector) !== $this->vectorDimension) {
            throw new Exception('Invalid query vector dimension: expected ' . $this->vectorDimension . ', got ' . count($vector));
        }

        $searchBody = [
            'vector' => $vector,
            'limit' => $limit,
            'with_payload' => true,
            'score_threshold' => $scoreThreshold,
        ];

        if ($employeeId !== null) {
            $searchBody['filter'] = [
                'must' => [
                    ['key' => 'employee_id', 'match' => ['value' => $employeeId]],
                ],
            ];
        }

        $data = $this->httpPost(
            "/collections/{$this->collectionName}/points/search",
            $searchBody,
            'Qdrant search failed'
        );

        return $data['result'] ?? [];
    }

    public function ensureCollection(): void
    {
        try {
            /** @var Response $response */
            $response = Http::timeout(self::HTTP_TIMEOUT)
                ->get("{$this->qdrantUrl}/collections/{$this->collectionName}");

            if ($response->status() >= 200 && $response->status() < 300) {
                return;
            }

            $this->createCollection();
        } catch (Exception $e) {
            $this->createCollection();
        }
    }

    private function createCollection(): void
    {
        $this->httpPut(
            "/collections/{$this->collectionName}",
            [
                'vectors' => [
                    'size' => $this->vectorDimension,
                    'distance' => 'Cosine',
                ],
            ],
            'Qdrant collection creation failed'
        );
    }

    public function deletePoint(int $entryId): void
    {
        $this->httpPost(
            "/collections/{$this->collectionName}/points/delete",
            ['points' => [$entryId]],
            'Failed to delete point'
        );
    }

    public function deletePoints(array $entryIds): void
    {
        if (empty($entryIds)) {
            return;
        }

        $this->httpPost(
            "/collections/{$this->collectionName}/points/delete",
            ['points' => $entryIds],
            'Failed to delete points'
        );
    }

    private function httpPost(string $endpoint, array $data, string $errorMessage): array
    {
        /** @var Response $response */
        $response = Http::timeout(self::HTTP_TIMEOUT)
            ->post("{$this->qdrantUrl}{$endpoint}", $data);

        if ($response->status() < 200 || $response->status() >= 300) {
            throw new Exception($errorMessage . ': ' . $response->body());
        }

        return $response->json();
    }

    private function httpPut(string $endpoint, array $data, string $errorMessage): void
    {
        /** @var Response $response */
        $response = Http::timeout(self::HTTP_TIMEOUT)
            ->put("{$this->qdrantUrl}{$endpoint}", $data);

        if ($response->status() < 200 || $response->status() >= 300) {
            throw new Exception($errorMessage . ': ' . $response->body());
        }
    }
}
