<?php

namespace App\Services;

use App\Models\Department;
use App\Models\User;

class EmployeeDepartmentService
{
    public function getEmployeeDepartments($managerId)
    {
        $department = Department::select(['id', 'name'])
            ->with([
                'employees:id,full_name',
                'employees.latestFatigueScore',
            ])
            ->where('manager_id', $managerId)
            ->firstOrFail();

        return [
            'department_id' => $department->id,
            'department_name' => $department->name,
            'employees' => $department->employees->map(function (User $employee) {
                $latest = $employee->latestFatigueScore;

                return [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'fatigue_score' => $latest ? [
                        'score_date' => $latest->score_date?->toDateString(),
                        'total_score' => $latest->total_score,
                        'risk_level' => $latest->risk_level,
                        'quantitative_score' => $latest->quantitative_score,
                        'qualitative_score' => $latest->qualitative_score,
                        'psychological_score' => $latest->psychological_score,
                    ] : null,
                ];
            })->values(),
        ];
    }
}
