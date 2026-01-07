<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftAssignmentRequest;
use App\Http\Requests\BulkAssignmentsRequest;
use App\Http\Requests\WeeklyAssignmentsRequest;
use Illuminate\Http\Request;
use App\Services\AssigmentsService;

class ShiftAssigmentsController extends Controller
{
    protected AssigmentsService $assigmentsService;

    public function __construct(AssigmentsService $assigmentsService)
    {
        $this->assigmentsService = $assigmentsService;
    }

    public function getAssignments()
    {
        $data = $this->assigmentsService->listAssignments();
        return $this->responseJSON($data, 'success', 200);
    }

    public function getShiftAssignments($shiftId)
    {
        $data = $this->assigmentsService->listByShift((int) $shiftId);
        return $this->responseJSON($data, 'success', 200);
    }

    public function createAssignment(StoreShiftAssignmentRequest $request)
    {
        $assignment = $this->assigmentsService->createAssignment($request->validated());
        return $this->responseJSON($assignment, 'success', 201);
    }

    public function createBulkAssignments(BulkAssignmentsRequest $request)
    {
        $assignments = $this->assigmentsService->createBulkAssignments($request->validated('assignments'));
        return $this->responseJSON($assignments, 'success', 201);
    }

    public function getWeeklyAssignments(WeeklyAssignmentsRequest $request)
    {
        $data = $request->validated();

        $schedule = $this->assigmentsService->getWeeklySchedule($data['start_date'], $data['department_id'] ?? null);

        return $this->responseJSON($schedule, 'success', 200);
    }
}
