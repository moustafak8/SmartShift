<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateScheduleRequest;
use App\Services\GenerateScheduleService;
use Illuminate\Http\Request;

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
                $request->getEndDate()
            );

            return $this->responseJSON($result, $result['success'] ? 'success' : 'error', $result['success'] ? 200 : 422);
        } catch (\Throwable $e) {
            return $this->responseJSON([
                'message' => 'Schedule generation failed',
                'error' => $e->getMessage(),
            ], 'error', 500);
        }
    }

    public function saveReviewed(Request $request)
    {
        try {
            $assignments = $request->input('assignments', []);

            $result = $this->generateScheduleService->saveReviewedSchedule($assignments);

            return $this->responseJSON($result, $result['success'] ? 'success' : 'error', $result['success'] ? 200 : 422);
        } catch (\Throwable $e) {
            return $this->responseJSON([
                'message' => 'Failed to save reviewed schedule',
                'error' => $e->getMessage(),
            ], 'error', 500);
        }
    }
}
