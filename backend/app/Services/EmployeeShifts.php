<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;

class EmployeeShifts
{
    public function getEmployeeShifts($id)
    {
        $employee = User::select([
            'id',
            'full_name',
            'email',
            'phone',
        ])
            ->with([
                'latestFatigueScore',
                'userType',
                'departments',
            ])
            ->findOrFail($id);

        // Get upcoming 3 shifts (status = 'assigned' or 'confirmed')
        $upcomingShifts = $employee
            ->shift_assigments()
            ->join('shifts', 'shift__assigments.shift_id', '=', 'shifts.id')
            ->whereDate('shifts.shift_date', '>=', Carbon::today())
            ->whereIn('shift__assigments.status', ['assigned', 'confirmed'])
            ->select([
                'shifts.id',
                'shifts.shift_date',
                'shifts.start_time',
                'shifts.end_time',
                'shifts.shift_type',
                'shift__assigments.assignment_type',
                'shift__assigments.status',
            ])
            ->orderBy('shifts.shift_date', 'asc')
            ->limit(3)
            ->get();

        // Get this month's stats
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $monthStats = $employee
            ->shift_assigments()
            ->join('shifts', 'shift__assigments.shift_id', '=', 'shifts.id')
            ->whereBetween('shifts.shift_date', [$monthStart, $monthEnd])
            ->whereIn('shift__assigments.status', ['assigned', 'confirmed', 'completed'])
            ->selectRaw('COUNT(*) as total_shifts')
            ->selectRaw('SUM(TIME_TO_SEC(TIMEDIFF(shifts.end_time, shifts.start_time)) / 3600) as total_hours')
            ->selectRaw("SUM(CASE WHEN shifts.shift_type = 'night' THEN 1 ELSE 0 END) as night_shifts")
            ->first();

        // Calculate consecutive days
        $consecutiveDays = $this->calculateConsecutiveDays($employee, $monthStart, $monthEnd);

        $latestFatigue = $employee->latestFatigueScore;

        return [
            'employee_id' => $employee->id,
            'employee_name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'position' => $employee->userType?->name,
            'employee_code' => 'EMP-'.str_pad($employee->id, 3, '0', STR_PAD_LEFT),
            'department' => $employee->departments?->first()?->name,
            'fatigue_score' => $latestFatigue ? [
                'total_score' => $latestFatigue->total_score,
                'risk_level' => $latestFatigue->risk_level,
                'score_date' => $latestFatigue->score_date?->toDateString(),
                'breakdown' => [
                    'quantitative' => $latestFatigue->quantitative_score,
                    'qualitative' => $latestFatigue->qualitative_score,
                    'psychological' => $latestFatigue->psychological_score,
                ],
            ] : null,
            'this_month_stats' => [
                'total_shifts' => (int) ($monthStats->total_shifts ?? 0),
                'total_hours' => (int) ($monthStats->total_hours ?? 0),
                'night_shifts' => (int) ($monthStats->night_shifts ?? 0),
                'consecutive_days' => $consecutiveDays,
            ],
            'upcoming_shifts' => $upcomingShifts->map(function ($shift) {
                $start = Carbon::createFromFormat('H:i:s', $shift->start_time);
                $end = Carbon::createFromFormat('H:i:s', $shift->end_time);
                $duration = $end->diffInHours($start);

                return [
                    'shift_id' => $shift->id,
                    'shift_date' => $shift->shift_date->toDateString(),
                    'shift_date_formatted' => $shift->shift_date->format('l, F j'),
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'duration_hours' => $duration,
                    'shift_type' => $shift->shift_type,
                    'assignment_type' => $shift->assignment_type,
                    'status' => $shift->status,
                ];
            })->values(),
        ];
    }

    private function calculateConsecutiveDays(User $employee, $monthStart, $monthEnd)
    {
        $shifts = $employee
            ->shift_assigments()
            ->join('shifts', 'shift__assigments.shift_id', '=', 'shifts.id')
            ->whereBetween('shifts.shift_date', [$monthStart, $monthEnd])
            ->whereIn('shift__assigments.status', ['assigned', 'confirmed', 'completed'])
            ->pluck('shifts.shift_date')
            ->unique()
            ->sort()
            ->values();

        if ($shifts->isEmpty()) {
            return 0;
        }

        $maxConsecutive = 1;
        $currentConsecutive = 1;

        for ($i = 1; $i < count($shifts); $i++) {
            $prev = Carbon::parse($shifts[$i - 1]);
            $current = Carbon::parse($shifts[$i]);

            if ($current->diffInDays($prev) === 1) {
                $currentConsecutive++;
                $maxConsecutive = max($maxConsecutive, $currentConsecutive);
            } else {
                $currentConsecutive = 1;
            }
        }

        return $maxConsecutive;
    }
}
