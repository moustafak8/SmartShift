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

    public function getWeeklySchedule(string $startDate, ?int $departmentId = null): array
    {
        $normalizedStart = trim($startDate, "\"' ");
        $start = Carbon::parse($normalizedStart)->startOfDay();
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

        $labels = [
            'day' => '7-3pm',
            'evening' => '3-11pm',
            'night' => '11-7am',
        ];

        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $dateKey = $start->copy()->addDays($i)->toDateString();
            $days[$dateKey] = [
                'labels' => $labels,
                'day' => [],
                'evening' => [],
                'night' => [],
            ];
        }

        foreach ($assignments as $a) {
            $dateValue = $a->shift?->shift_date;
            $date = is_string($dateValue) ? $dateValue : ($dateValue?->toDateString() ?? '');
            if ($date === '') {
                continue;
            }

            $type = $a->shift->shift_type ?? 'day';
            if (! isset($days[$date])) {
                $days[$date] = [
                    'labels' => $labels,
                    'day' => [],
                    'evening' => [],
                    'night' => [],
                ];
            }
            $fullName = optional($a->employee)->full_name ?? '';
            $initials = $this->toInitials($fullName);
            $days[$date][$type][] = [
                'assignment_id' => $a->id,
                'employee_id' => $a->employee_id,
                'full_name' => $fullName,
                'initials' => $initials,
                'assignment_type' => $a->assignment_type,
                'status' => $a->status,
            ];
        }

        return [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'days' => $days,
        ];
    }

    private function toInitials(string $fullName): string
    {
        $parts = preg_split('/\s+/', trim($fullName));
        $letters = [];
        foreach ($parts as $p) {
            if ($p !== '') {
                $letters[] = mb_strtoupper(mb_substr($p, 0, 1));
            }
            if (count($letters) === 2) {
                break;
            }
        }

        return implode('.', $letters);
    }
}
