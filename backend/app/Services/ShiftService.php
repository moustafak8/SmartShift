<?php

namespace App\Services;

use App\Models\Shifts;
use Illuminate\Support\Collection;

class ShiftService
{
    public function listShifts(): Collection
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
        ])->orderBy('shift_date')->get();
    }

    public function createShift(array $data): Shifts
    {
        return Shifts::create($data);
    }
}
