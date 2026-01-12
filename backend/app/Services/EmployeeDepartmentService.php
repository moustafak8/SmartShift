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
                'employees:id,full_name,is_active',
                'employees.latestFatigueScore',
                'employees.employeeDepartments' => function ($query) use ($managerId) {
                    $query->whereHas('department', function ($q) use ($managerId) {
                        $q->where('manager_id', $managerId);
                    })->with('position:id,name');
                },
            ])
            ->where('manager_id', $managerId)
            ->firstOrFail();

        return [
            'department_name' => $department->name,
            'employees' => $department->employees->map(function (User $employee) {
                $latest = $employee->latestFatigueScore;
                $empDept = $employee->employeeDepartments->first();

                return [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'is_active' => $employee->is_active,
                    'position' => $empDept && $empDept->position ? $empDept->position->name : null,
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
