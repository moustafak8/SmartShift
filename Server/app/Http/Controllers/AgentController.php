<?php

namespace App\Http\Controllers;

use App\Services\AgentService;
use App\Services\EmployeeShifts;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function __construct(
        private AgentService $agentService,
        private EmployeeShifts $employeeShiftsService
    ) {}

    public function getEmployee(int $id)
    {
        return $this->responseJSON($this->agentService->getEmployee($id), 'success', 200);
    }

    public function getShift(int $id)
    {
        return $this->responseJSON($this->agentService->getShift($id), 'success', 200);
    }

    public function getEmployeeAvailability(Request $request, int $employeeId)
    {
        $date = $request->query('date');

        return $this->responseJSON($this->agentService->getEmployeeAvailability($employeeId, $date), 'success', 200);
    }

    public function getFatigueScore(int $employeeId)
    {
        return $this->responseJSON($this->agentService->getFatigueScore($employeeId), 'success', 200);
    }

    public function getShiftAssignments(int $shiftId)
    {
        return $this->responseJSON($this->agentService->getShiftAssignments($shiftId), 'success', 200);
    }

    public function getEmployeeShifts(int $employeeId)
    {
        return $this->responseJSON($this->employeeShiftsService->getEmployeeShifts($employeeId), 'success', 200);
    }
}
