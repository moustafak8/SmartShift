<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePositionRequest;
use App\Services\PositionService;

class PositionController extends Controller
{
    protected PositionService $positionService;

    public function __construct(PositionService $positionService)
    {
        $this->positionService = $positionService;
    }

    public function getPositionsByDepartment($departmentId)
    {
        $positions = $this->positionService->getPositionsByDepartment($departmentId);

        return $this->responseJSON($positions, 'success', 200);
    }

    public function getAllPositions()
    {
        $positions = $this->positionService->getAllPositions();

        return $this->responseJSON($positions, 'success', 200);
    }

    public function getPositionById($positionId)
    {
        $position = $this->positionService->getPositionById($positionId);

        if (! $position) {
            return $this->responseJSON(null, 'Position not found', 404);
        }

        return $this->responseJSON($position, 'success', 200);
    }

    public function storePosition(StorePositionRequest $request)
    {
        $position = $this->positionService->createPosition($request->validated());

        return $this->responseJSON($position, 'success', 201);
    }

    public function updatePosition($positionId, StorePositionRequest $request)
    {
        $updated = $this->positionService->updatePosition($positionId, $request->validated());

        if (! $updated) {
            return $this->responseJSON(null, 'Position not found', 404);
        }

        $position = $this->positionService->getPositionById($positionId);

        return $this->responseJSON($position, 'success', 200);
    }

    public function deletePosition($positionId)
    {
        $deleted = $this->positionService->deletePosition($positionId);

        if (! $deleted) {
            return $this->responseJSON(null, 'Position not found', 404);
        }

        return $this->responseJSON(null, 'success', 200);
    }
}
