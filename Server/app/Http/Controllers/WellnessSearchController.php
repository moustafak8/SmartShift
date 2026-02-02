<?php

namespace App\Http\Controllers;

use App\Http\Requests\SearchWellnessRequest;
use App\Services\WellnessSearchService;

class WellnessSearchController extends Controller
{
    public function __construct(
        private WellnessSearchService $searchService
    ) {}

    public function search(SearchWellnessRequest $request)
    {
        try {
            $results = $this->searchService->search($request->validated('query'));

            return $this->responseJSON([
                'query' => $request->validated('query'),
                'results' => $results,
                'count' => count($results),
            ]);
        } catch (\Exception $e) {
            return $this->responseJSON([
                'error' => 'Search failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function searchWithInsights(SearchWellnessRequest $request)
    {
        try {
            $response = $this->searchService->generateResponse($request->validated('query'));

            return $this->responseJSON($response);
        } catch (\Exception $e) {
            return $this->responseJSON([
                'error' => 'Search failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
