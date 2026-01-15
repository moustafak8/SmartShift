<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateScheduleRequest;
use App\Services\GenerateScheduleService;

class GenerateScheduleController extends Controller
{
    private GenerateScheduleService $generateScheduleService;
    public function __construct(GenerateScheduleService $service)
    {
        $this->generateScheduleService = $service;
    }

    public function generate(GenerateScheduleRequest $request)
    {
        try {
            $result = $this->generateScheduleService->generateSchedule(
                $request->getDepartmentId(),
                $request->getStartDate(),
                $request->getEndDate(),
                false
            );

            return $this->responseJSON($result, $result['success'] ? 'success' : 'error', $result['success'] ? 200 : 422);
        } catch (\Throwable $e) {
            return $this->responseJSON([
                'message' => 'Schedule generation failed',
                'error' => $e->getMessage(),
            ], 'error', 500);
        }
    }
}
