<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkAssignmentsRequest;
use App\Http\Requests\StoreShiftAssignmentRequest;
use App\Http\Requests\WeeklyAssignmentsRequest;
use App\Services\AssigmentsService;

class ShiftAssigmentsController extends Controller
{
    public function __construct(
        private AssigmentsService $assigmentsService
    ) {}

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
        try {
            $assignment = $this->assigmentsService->createAssignment($request->validated());

            return $this->responseJSON($assignment, 'Assignment created successfully', 201);
        } catch (\Exception $e) {
            return $this->responseJSON(null, $e->getMessage(), 400);
        }
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

    public function getWeeklyAssignmentsByEmployee($employeeId, WeeklyAssignmentsRequest $request)
    {
        $data = $request->validated();

        $schedule = $this->assigmentsService->getWeeklyScheduleByEmployee($data['start_date'], (int) $employeeId, $data['department_id'] ?? null);

        return $this->responseJSON($schedule, 'success', 200);
    }

    public function updateAssignment($assignmentId, StoreShiftAssignmentRequest $request)
    {
        $assignment = $this->assigmentsService->updateAssignment((int) $assignmentId, $request->validated());

        if (! $assignment) {
            return $this->responseJSON(null, 'Assignment not found', 404);
        }

        return $this->responseJSON($assignment, 'Assignment updated successfully', 200);
    }

    public function deleteAssignment($assignmentId)
    {
        $deleted = $this->assigmentsService->deleteAssignment((int) $assignmentId);

        if (! $deleted) {
            return $this->responseJSON(null, 'Assignment not found', 404);
        }

        return $this->responseJSON(null, 'Assignment deleted successfully', 200);
    }
}
