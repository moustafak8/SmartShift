<?php

namespace App\Services;

use App\Models\Shift_Assigments;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AssigmentsService
{
    public function listAssignments(): Collection
    {
        return Shift_Assigments::select([
            'id',
            'shift_id',
            'employee_id',
            'assignment_type',
            'status',
        ])->orderByDesc('id')->get();
    }

    public function listByShift(int $shiftId): Collection
    {
        return Shift_Assigments::where('shift_id', $shiftId)
            ->select(['id', 'shift_id', 'employee_id', 'assignment_type', 'status'])
            ->orderBy('id')
            ->get();
    }

    public function createAssignment(array $data): Shift_Assigments
    {
        return Shift_Assigments::create($data);
    }

    public function createBulkAssignments(array $assignments): Collection
    {
        $ids = [];
        foreach ($assignments as $data) {
            $ids[] = Shift_Assigments::create($data)->id;
        }

        return Shift_Assigments::whereIn('id', $ids)->get();
    }

    public function updateAssignment(int $assignmentId, array $data): ?Shift_Assigments
    {
        $assignment = Shift_Assigments::find($assignmentId);

        if (! $assignment) {
            return null;
        }

        $assignment->update($data);

        return $assignment->fresh();
    }

    public function deleteAssignment(int $assignmentId): bool
    {
        $assignment = Shift_Assigments::find($assignmentId);

        if (! $assignment) {
            return false;
        }

        return $assignment->delete();
    }

    public function determineAssignmentType(int $employeeId, int $shiftId, string $shiftDate): string
    {
        $weekStart = Carbon::parse($shiftDate)->startOfWeek();
        $weekEnd = Carbon::parse($shiftDate)->endOfWeek();

        $weeklyAssignments = Shift_Assigments::where('employee_id', $employeeId)
            ->whereHas('shift', function ($q) use ($weekStart, $weekEnd) {
                $q->whereBetween('shift_date', [$weekStart->toDateString(), $weekEnd->toDateString()]);
            })
            ->count();

        return $weeklyAssignments >= 6 ? 'overtime' : 'regular';
    }

    public function determineAssignmentStatus(int $shiftId, string $shiftDate): string
    {
        return 'confirmed';
    }

    public function updateAssignmentStatuses(array $assignmentIds): void
    {
        if (empty($assignmentIds)) {
            return;
        }

        $today = Carbon::today();

        $assignments = Shift_Assigments::with('shift:id,shift_date')
            ->whereIn('id', $assignmentIds)
            ->get();

        foreach ($assignments as $assignment) {
            if (! $assignment->shift) {
                continue;
            }

            $shiftDate = Carbon::parse($assignment->shift->shift_date);

            if ($shiftDate->lt($today)) {
                $assignment->update(['status' => 'completed']);
            }
        }
    }

    public function getWeeklySchedule(string $startDate, ?int $departmentId = null): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = $start->copy()->addDays(6)->endOfDay();

        $assignments = Shift_Assigments::with([
            'shift:id,shift_date,shift_type,department_id',
            'employee:id,full_name',
        ])
            ->whereHas('shift', function ($q) use ($start, $end, $departmentId) {
                $q->whereBetween('shift_date', [$start->toDateString(), $end->toDateString()]);
                if ($departmentId !== null) {
                    $q->where('department_id', $departmentId);
                }
            })
            ->orderByDesc('id')
            ->get(['id', 'shift_id', 'employee_id', 'assignment_type', 'status']);

        return $this->formatSchedule($assignments, $start, $end);
    }

    public function getWeeklyScheduleByEmployee(string $startDate, int $employeeId): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = $start->copy()->addDays(6)->endOfDay();

        $assignments = Shift_Assigments::with([
            'shift:id,shift_date,shift_type,department_id',
            'employee:id,full_name',
        ])
            ->where('employee_id', $employeeId)
            ->whereHas('shift', function ($q) use ($start, $end) {
                $q->whereBetween('shift_date', [$start->toDateString(), $end->toDateString()]);
            })
            ->orderByDesc('id')
            ->get(['id', 'shift_id', 'employee_id', 'assignment_type', 'status']);

        return $this->formatSchedule($assignments, $start, $end, withLabels: true);
    }

    private function formatSchedule(Collection $assignments, Carbon $start, Carbon $end, bool $withLabels = false): array
    {
        $shiftLabels = [
            'day' => '7-3pm',
            'evening' => '3-11pm',
            'night' => '11-7am',
        ];

        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $dateKey = $start->copy()->addDays($i)->toDateString();
            $days[$dateKey] = [
                ...$withLabels ? ['labels' => $shiftLabels] : [],
                'day' => [],
                'evening' => [],
                'night' => [],
            ];
        }

        foreach ($assignments as $assignment) {
            $dateValue = $assignment->shift?->shift_date;
            $date = is_string($dateValue) ? $dateValue : ($dateValue?->toDateString() ?? '');

            if ($date === '' || ! isset($days[$date])) {
                continue;
            }

            $shiftType = $assignment->shift->shift_type ?? 'day';
            $days[$date][$shiftType][] = [
                'assignment_id' => $assignment->id,
                'employee_id' => $assignment->employee_id,
                'full_name' => $assignment->employee?->full_name ?? '',
                'assignment_type' => $assignment->assignment_type,
                'status' => $assignment->status,
            ];
        }

        return [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'days' => $days,
        ];
    }
}
