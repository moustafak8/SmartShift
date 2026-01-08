<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWellnessEntryRequest;
use App\Services\WellnessService;

class WellnessEntriesController extends Controller
{
    protected WellnessService $wellnessService;

    public function __construct(WellnessService $wellnessService)
    {
        $this->wellnessService = $wellnessService;
    }

    public function getEntries()
    {
        $entries = $this->wellnessService->listEntries();

        return $this->responseJSON($entries, 'success', 200);
    }

    public function getByEmployee($employeeId)
    {
        $entries = $this->wellnessService->listByEmployee((int) $employeeId);

        return $this->responseJSON($entries, 'success', 200);
    }

    public function storeEntry(StoreWellnessEntryRequest $request)
    {
        $entry = $this->wellnessService->createEntry($request->validated());

        return $this->responseJSON($entry, 'success', 201);
    }
}
