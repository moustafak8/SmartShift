<?php

namespace App\Services;

use App\Models\Shifts;
use App\Models\User;
use Exception;

class AgentService
{
    public function __construct(
        protected EmployeeAvailabilityService $availabilityService,
        protected ScoreService $scoreService,
        protected AssigmentsService $assignmentsService
    ) {}

    public function getEmployee(int $id): array
    {
        $employee = User::with(['userType', 'employeeDepartments.department'])
            ->findOrFail($id);

        return [
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
            ])->toArray(),
        ];
    }

    public function getShift(int $id): array
    {
        $shift = Shifts::with('department')->findOrFail($id);

        return [
            'id' => $shift->id,
            'department_id' => $shift->department_id,
            'department_name' => $shift->department?->name,
            'shift_date' => $shift->shift_date,
            'start_time' => $shift->start_time,
            'end_time' => $shift->end_time,
            'shift_type' => $shift->shift_type,
            'required_staff_count' => $shift->required_staff_count,
            'status' => $shift->status,
        ];
    }

    public function getEmployeeAvailability(int $employeeId, ?string $date = null): array
    {
        $date = $date ?? now()->toDateString();
        $availability = $this->availabilityService->getAvailabilityForDate($employeeId, $date);

        if ($availability === null) {
            return [
                'employee_id' => $employeeId,
                'date' => $date,
                'is_available' => true,
                'reason' => null,
                'preferred_shift_type' => null,
            ];
        }

        return [
            'employee_id' => $employeeId,
            'date' => $date,
            ...$availability,
        ];
    }

    public function getFatigueScore(int $employeeId): array
    {
        try {
            return $this->scoreService->getLatestScoreForEmployee($employeeId);
        } catch (Exception $e) {
            return [
                'employee_id' => $employeeId,
                'total_score' => 0,
                'risk_level' => 'low',
                'breakdown' => [
                    'schedule_pressure' => ['weight' => 40, 'score' => 0],
                    'physical_wellness' => ['weight' => 40, 'score' => 0],
                    'mental_health' => ['weight' => 20, 'score' => 0],
                ],
            ];
        }
    }

    public function getShiftAssignments(int $shiftId): array
    {
        $shift = Shifts::findOrFail($shiftId);
        $assignments = $this->assignmentsService->listByShift($shiftId);

        return [
            'shift_id' => $shiftId,
            'required_staff_count' => $shift->required_staff_count,
            'current_staff_count' => $assignments->count(),
            'data' => $assignments->map(fn($a) => [
                'id' => $a->id,
                'employee_id' => $a->employee_id,
                'assignment_type' => $a->assignment_type,
                'status' => $a->status,
            ])->toArray(),
        ];
    }
}
