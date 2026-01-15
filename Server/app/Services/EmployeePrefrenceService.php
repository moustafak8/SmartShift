<?php

namespace App\Services;

use App\Models\Employee_Preferences;
use Illuminate\Support\Collection;

class EmployeePrefrenceService
{
    public function listPreferences(): Collection
    {
        return Employee_Preferences::select([
            'id',
            'employee_id',
            'preferred_shift_types',
            'max_shifts_per_week',
            'max_hours_per_week',
            'max_consecutive_days',
            'prefers_weekends',
            'notes',
        ])->orderByDesc('id')->get();
    }

    public function getByEmployee(int $employeeId): ?Employee_Preferences
    {
        return Employee_Preferences::where('employee_id', $employeeId)
            ->select([
                'id',
                'employee_id',
                'preferred_shift_types',
                'max_shifts_per_week',
                'max_hours_per_week',
                'max_consecutive_days',
                'prefers_weekends',
                'notes',
            ])
            ->first();
    }

    public function storePreference(array $data): Employee_Preferences
    {
        $employeeId = $data['employee_id'];

        return Employee_Preferences::updateOrCreate(
            ['employee_id' => $employeeId],
            [
                'preferred_shift_types' => $data['preferred_shift_types'] ?? null,
                'max_shifts_per_week' => $data['max_shifts_per_week'] ?? 5,
                'max_hours_per_week' => $data['max_hours_per_week'] ?? 40,
                'max_consecutive_days' => $data['max_consecutive_days'] ?? 5,
                'prefers_weekends' => $data['prefers_weekends'] ?? false,
                'notes' => $data['notes'] ?? null,
            ]
        );
    }

    public function deletePreference(int $employeeId): bool
    {
        return Employee_Preferences::where('employee_id', $employeeId)->delete() > 0;
    }
}
