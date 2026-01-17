<?php

namespace App\Http\Controllers;

use App\Models\Shifts;
use App\Models\User;
use App\Services\AssigmentsService;
use App\Services\EmployeeAvailabilityService;
use App\Services\ScoreService;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function __construct(
        protected EmployeeAvailabilityService $availabilityService,
        protected ScoreService $scoreService,
        protected AssigmentsService $assignmentsService
    ) {}

  
    public function getEmployee(int $id)
    {
        $employee = User::with(['userType', 'employeeDepartments.department'])
            ->findOrFail($id);

        return $this->responseJSON([
            'id' => $employee->id,
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'is_active' => $employee->is_active,
            'user_type' => $employee->userType?->role_name,
            'departments' => $employee->employeeDepartments->map(fn($ed) => [
                'department_id' => $ed->department_id,
                'department_name' => $ed->department?->name,
                'is_primary' => $ed->is_primary,
            ]),
        ], 'success', 200);
    }

   
    public function getShift(int $id)
    {
        $shift = Shifts::with('department')->findOrFail($id);

        return $this->responseJSON([
            'id' => $shift->id,
            'department_id' => $shift->department_id,
            'department_name' => $shift->department?->name,
            'shift_date' => $shift->shift_date?->toDateString(),
            'start_time' => $shift->start_time,
            'end_time' => $shift->end_time,
            'shift_type' => $shift->shift_type,
            'required_staff_count' => $shift->required_staff_count,
            'status' => $shift->status,
        ], 'success', 200);
    }

   
    public function getEmployeeAvailability(Request $request, int $employeeId)
    {
        $date = $request->query('date', now()->toDateString());
        $availability = $this->availabilityService->getAvailabilityForDate($employeeId, $date);

        // Service returns null if no restrictions = available by default
        if ($availability === null) {
            return $this->responseJSON([
                'employee_id' => $employeeId,
                'date' => $date,
                'is_available' => true,
                'reason' => null,
                'preferred_shift_type' => null,
            ], 'success', 200);
        }

        return $this->responseJSON([
            'employee_id' => $employeeId,
            'date' => $date,
            ...$availability,
        ], 'success', 200);
    }

   
    public function getFatigueScore(int $employeeId)
    {
        try {
            $score = $this->scoreService->getLatestScoreForEmployee($employeeId);
            return $this->responseJSON($score, 'success', 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Return default score if no fatigue record exists
            return $this->responseJSON([
                'employee_id' => $employeeId,
                'total_score' => 0,
                'risk_level' => 'low',
                'breakdown' => [
                    'schedule_pressure' => ['weight' => 40, 'score' => 0],
                    'physical_wellness' => ['weight' => 40, 'score' => 0],
                    'mental_health' => ['weight' => 20, 'score' => 0],
                ],
            ], 'success', 200);
        }
    }

    
    public function getShiftAssignments(int $shiftId)
    {
        $shift = Shifts::findOrFail($shiftId);
        $assignments = $this->assignmentsService->listByShift($shiftId);

        return $this->responseJSON([
            'shift_id' => $shiftId,
            'required_staff_count' => $shift->required_staff_count,
            'current_staff_count' => $assignments->count(),
            'data' => $assignments->map(fn($a) => [
                'id' => $a->id,
                'employee_id' => $a->employee_id,
                'assignment_type' => $a->assignment_type,
                'status' => $a->status,
            ]),
        ], 'success', 200);
    }
}
