<?php

namespace App\Services;

use App\Models\Shift_Assigments;
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
        ])->with('employee')->orderByDesc('id')->get();
    }

    public function listByShift(int $shiftId): Collection
    {
        return Shift_Assigments::where('shift_id', $shiftId)
            ->select(['id', 'shift_id', 'employee_id', 'assignment_type', 'status'])
            ->with('employee')
            ->orderBy('id')
            ->get();
    }

    public function createAssignment(array $data): Shift_Assigments
    {
        $assignment = Shift_Assigments::create($data);
        return $assignment->load('employee');
    }

    public function createBulkAssignments(array $assignments): Collection
    {
        $ids = [];
        foreach ($assignments as $data) {
            $ids[] = Shift_Assigments::create($data)->id;
        }
        return Shift_Assigments::whereIn('id', $ids)
            ->with('employee')
            ->get();
    }
}
