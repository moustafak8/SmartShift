<?php

namespace App\Services;

use App\Models\Shifts;
use App\Models\Shift_Position_Requirement;
use App\Models\Shift_Assigments;
use Illuminate\Support\Collection;

class ShiftService
{
    public function listShifts($departmentId): Collection
    {
        return Shifts::select([
            'id',
            'department_id',
            'shift_template_id',
            'shift_date',
            'start_time',
            'end_time',
            'shift_type',
            'required_staff_count',
            'notes',
            'status',
        ])->where('department_id', $departmentId)->orderBy('shift_date')->get();
    }

    public function createShift(array $data): Shifts|Collection
    {
        if (isset($data['is_recurring']) && $data['is_recurring']) {
            return $this->createRecurringShifts($data);
        }
        $positionRequirements = $data['position_requirements'] ?? null;
        unset($data['position_requirements']);

        $shift = Shifts::create($data);
        if ($positionRequirements) {
            $this->createPositionRequirements($shift, $positionRequirements);
        } else {
            $this->copyTemplateRequirements($shift);
        }

        return $shift;
    }

    private function createRecurringShifts(array $data): Collection
    {
        $shifts = collect();
        $startDate = new \DateTime($data['shift_date']);
        $endDate = new \DateTime($data['recurrence_end_date']);
        $recurrenceType = $data['recurrence_type'];

        $positionRequirements = $data['position_requirements'] ?? null;

        $baseData = $data;
        unset($baseData['is_recurring'], $baseData['recurrence_type'], $baseData['recurrence_end_date'], $baseData['position_requirements']);

        $currentDate = clone $startDate;

        while ($currentDate <= $endDate) {
            $shiftData = array_merge($baseData, [
                'shift_date' => $currentDate->format('Y-m-d'),
            ]);

            $shift = Shifts::create($shiftData);
            if ($positionRequirements) {
                $this->createPositionRequirements($shift, $positionRequirements);
            } else {
                $this->copyTemplateRequirements($shift);
            }

            $shifts->push($shift);
            switch ($recurrenceType) {
                case 'daily':
                    $currentDate->modify('+1 day');
                    break;
                case 'weekly':
                    $currentDate->modify('+1 week');
                    break;
                case 'monthly':
                    $currentDate->modify('+1 month');
                    break;
            }
        }

        return $shifts;
    }

    private function copyTemplateRequirements(Shifts $shift): void
    {
        if (! $shift->shift_template_id) {
            return;
        }

        $templateRequirements = Shift_Position_Requirement::where(
            'shift_template_id',
            $shift->shift_template_id
        )->get();

        foreach ($templateRequirements as $req) {
           Shift_Position_Requirement::create([
                'shift_id' => $shift->id,
                'position_id' => $req->position_id,
                'required_count' => $req->required_count,
                'filled_count' => 0,
            ]);
        }
    }

    private function createPositionRequirements(Shifts $shift, array $requirements): void
    {
        foreach ($requirements as $requirement) {
            Shift_Position_Requirement::create([
                'shift_id' => $shift->id,
                'position_id' => $requirement['position_id'],
                'required_count' => $requirement['required_count'],
                'filled_count' => 0,
            ]);
        }
    }

    public function calculateShiftDuration(string $startTime, string $endTime): float
    {
        $start = new \DateTime($startTime);
        $end = new \DateTime($endTime);
        // If end time is before or equal to start time, it's an overnight shift
        if ($end <= $start) {
            $end->modify('+1 day');
        }

        $interval = $start->diff($end);

        return $interval->h + ($interval->i / 60);
    }

    public function isOvernightShift(string $startTime, string $endTime): bool
    {
        return $endTime <= $startTime;
    }

    public function updateShiftStatusesByAssignments(array $shiftIds): void
    {
        if (empty($shiftIds)) {
            return;
        }

        $shifts = Shifts::whereIn('id', $shiftIds)->get();

        foreach ($shifts as $shift) {
            $assignedCount = Shift_Assigments::where('shift_id', $shift->id)->count();
            $requiredCount = $shift->required_staff_count ?? 0;

            if ($requiredCount === 0) {
                $status = 'open';
            } elseif ($assignedCount >= $requiredCount) {
                $status = 'filled';
            } elseif ($assignedCount > 0 && $assignedCount < $requiredCount) {
                $status = 'understaffed';
            } else {
                $status = 'open';
            }

            $shift->update(['status' => $status]);
        }
    }
}
