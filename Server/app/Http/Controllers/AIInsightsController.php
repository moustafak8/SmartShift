<?php

namespace App\Http\Controllers;

use App\Services\InsightService;

class AIInsightsController extends Controller
{
    protected InsightService $insightService;

    public function __construct(InsightService $insightService) {
        $this->insightService = $insightService;
    }

    public function index(int $departmentId)
    {
        return $this->responseJSON($this->insightService->getInsightsForDepartment($departmentId));
    }

    public function show(int $insightId)
    {
        $insight = $this->insightService->getInsight($insightId);
        return $this->responseJSON($insight);
    }

    public function markAsRead(int $insightId)
    {
        $insight = $this->insightService->markAsRead($insightId);
        return $this->responseJSON($insight);
    }

    public function unreadCount(int $departmentId)
    {
        return $this->responseJSON(['count' => $this->insightService->getUnreadCount($departmentId)]);
    }
}
