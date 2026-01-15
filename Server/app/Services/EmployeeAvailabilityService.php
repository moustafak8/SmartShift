<?php

namespace App\Services;

use App\Models\Employee_Availability;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class EmployeeAvailabilityService
{
    public function listAvailability(): Collection
    {
        return Employee_Availability::select([
            'id',
            'employee_id',
            'day_of_week',
            'specific_date',
            'is_available',
            'preferred_shift_type',
            'reason',
            'notes',
        ])->orderByDesc('id')->get();
    }

    public function getByEmployee(int $employeeId): Collection
    {
        return Employee_Availability::where('employee_id', $employeeId)
            ->select([
                'id',
                'employee_id',
                'day_of_week',
                'specific_date',
                'is_available',
                'preferred_shift_type',
                'reason',
                'notes',
            ])
            ->orderBy('id')
            ->get();
    }

    public function getAvailabilityForDate(int $employeeId, string $date): ?array
    {
        $carbon = Carbon::parse($date);
        $dayOfWeek = $carbon->dayOfWeek; // 0=Sunday, 6=Saturday

        // First check for a specific date exception
        $specificDateRecord = Employee_Availability::where('employee_id', $employeeId)
            ->where('specific_date', $carbon->toDateString())
            ->first();

        if ($specificDateRecord) {
            return [
                'is_available' => $specificDateRecord->is_available,
                'preferred_shift_type' => $specificDateRecord->preferred_shift_type,
                'reason' => $specificDateRecord->reason,
                'notes' => $specificDateRecord->notes,
                'type' => 'specific_date', // indicates this is an exception
                'id' => $specificDateRecord->id,
            ];
        }

        // Fall back to recurring day_of_week pattern
        $recurringRecord = Employee_Availability::where('employee_id', $employeeId)
            ->where('day_of_week', $dayOfWeek)
            ->whereNull('specific_date')
            ->first();

        if ($recurringRecord) {
            return [
                'is_available' => $recurringRecord->is_available,
                'preferred_shift_type' => $recurringRecord->preferred_shift_type,
                'reason' => $recurringRecord->reason,
                'notes' => $recurringRecord->notes,
                'type' => 'recurring', // indicates this is from weekly pattern
                'id' => $recurringRecord->id,
            ];
        }

        return null;
    }

    public function getWeeklyPattern(int $employeeId): array
    {
        $records = Employee_Availability::where('employee_id', $employeeId)
            ->whereNull('specific_date')
            ->select(['id', 'day_of_week', 'is_available', 'preferred_shift_type'])
            ->get();

        $pattern = [];
        foreach ($records as $record) {
            $pattern[$record->day_of_week] = [
                'is_available' => $record->is_available,
                'preferred_shift_type' => $record->preferred_shift_type,
                'id' => $record->id,
            ];
        }

        return $pattern;
    }

    public function getSpecificDateExceptions(int $employeeId): Collection
    {
        return Employee_Availability::where('employee_id', $employeeId)
            ->whereNotNull('specific_date')
            ->select([
                'id',
                'specific_date',
                'is_available',
                'preferred_shift_type',
                'reason',
                'notes',
            ])
            ->get();
    }

    public function storeAvailability(array $data): Employee_Availability
    {
        // If is_recurring is true, create availability for all 7 days of the week
        if (isset($data['is_recurring']) && $data['is_recurring']) {
            $ids = [];
            for ($day = 0; $day < 7; $day++) {
                $record = Employee_Availability::create([
                    'employee_id' => $data['employee_id'],
                    'day_of_week' => $day,
                    'specific_date' => null,
                    'is_available' => $data['is_available'] ?? true,
                    'preferred_shift_type' => $data['preferred_shift_type'] ?? null,
                    'reason' => $data['reason'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]);
                $ids[] = $record->id;
            }

            return Employee_Availability::whereIn('id', $ids)->first();
        }

        return Employee_Availability::create([
            'employee_id' => $data['employee_id'],
            'day_of_week' => $data['day_of_week'] ?? null,
            'specific_date' => $data['specific_date'] ?? null,
            'is_available' => $data['is_available'] ?? true,
            'preferred_shift_type' => $data['preferred_shift_type'] ?? null,
            'reason' => $data['reason'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function updateAvailability(int $id, array $data): Employee_Availability
    {
        $availability = Employee_Availability::findOrFail($id);

        $availability->update([
            'day_of_week' => $data['day_of_week'] ?? $availability->day_of_week,
            'specific_date' => $data['specific_date'] ?? $availability->specific_date,
            'is_available' => $data['is_available'] ?? $availability->is_available,
            'preferred_shift_type' => $data['preferred_shift_type'] ?? $availability->preferred_shift_type,
            'reason' => $data['reason'] ?? $availability->reason,
            'notes' => $data['notes'] ?? $availability->notes,
        ]);

        return $availability;
    }

    public function deleteAvailability(int $id): bool
    {
        return Employee_Availability::destroy($id) > 0;
    }
}
