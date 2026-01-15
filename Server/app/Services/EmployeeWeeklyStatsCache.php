<?php

namespace App\Services;

use App\Models\Shift_Assigments;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class EmployeeWeeklyStatsCache
{
    private const CACHE_TTL_MINUTES = 5;

    private const CACHE_PREFIX = 'employee_weekly_stats';

    public function __construct(
        private ShiftService $shiftService,
        private Shift_Assigments $assignmentsModel
    ) {}

    public function getWeeklyStats(int $employeeId, string $date): array
    {
        $cacheKey = $this->getCacheKey($employeeId, $date);

        return Cache::remember($cacheKey, self::CACHE_TTL_MINUTES * 60, function () use ($employeeId, $date) {
            $carbon = Carbon::parse($date);
            $weekStart = $carbon->startOfWeek();
            $weekEnd = $carbon->endOfWeek();

            $assignments = $this->assignmentsModel
                ->with('shift')
                ->where('employee_id', $employeeId)
                ->whereHas('shift', fn ($q) => $q->whereBetween('shift_date', [$weekStart->toDateString(), $weekEnd->toDateString()]))
                ->get();

            $shiftsCount = count($assignments);
            $hoursTotal = $assignments->sum(fn ($a) => $this->shiftService->calculateShiftDuration(
                $a->shift->start_time,
                $a->shift->end_time
            ));

            return [
                'shifts_count' => $shiftsCount,
                'hours_total' => $hoursTotal,
                'assignments' => $assignments,
            ];
        });
    }

    public function getShiftsInWeek(int $employeeId, string $date): int
    {
        return $this->getWeeklyStats($employeeId, $date)['shifts_count'];
    }

    public function getHoursInWeek(int $employeeId, string $date): float
    {
        return (float) $this->getWeeklyStats($employeeId, $date)['hours_total'];
    }

    public function countConsecutiveDays(int $employeeId, string $date): int
    {
        $cacheKey = 'employee_consecutive_days:'.$employeeId.':'.$date;

        return Cache::remember($cacheKey, self::CACHE_TTL_MINUTES * 60, function () use ($employeeId, $date) {
            $carbon = Carbon::parse($date);
            $consecutiveDays = 1;
            $checkDate = $carbon->copy()->subDay();

            while ($checkDate->diffInDays($carbon) < 30) {
                $hasShift = $this->assignmentsModel
                    ->with('shift')
                    ->where('employee_id', $employeeId)
                    ->whereHas('shift', fn ($q) => $q->where('shift_date', $checkDate->toDateString()))
                    ->exists();

                if ($hasShift) {
                    $consecutiveDays++;
                    $checkDate->subDay();
                } else {
                    break;
                }
            }

            return $consecutiveDays;
        });
    }

    public function clear(int $employeeId, string $date): void
    {
        Cache::forget($this->getCacheKey($employeeId, $date));
    }

    private function getCacheKey(int $employeeId, string $date): string
    {
        $weekStart = Carbon::parse($date)->startOfWeek()->toDateString();

        return self::CACHE_PREFIX.":{$employeeId}:{$weekStart}";
    }
}
