<?php

namespace App\Http\Requests;

use App\Models\Shift_Assigments;
use App\Models\Shifts;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShiftAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'employee_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('shift__assigments')->where(function ($query) {
                    return $query->where('shift_id', $this->input('shift_id'));
                }),
                function ($attribute, $value, $fail) {
                    if ($this->boolean('force_assign')) {
                        return;
                    }

                    $shiftId = $this->input('shift_id');
                    $shift = Shifts::find($shiftId);

                    if (! $shift) {
                        return;
                    }

                    $hasExistingAssignment = Shift_Assigments::where('employee_id', $value)
                        ->whereHas('shift', function ($query) use ($shift) {
                            $query->where('shift_date', $shift->shift_date);
                        })
                        ->exists();

                    if ($hasExistingAssignment) {
                        $fail('This employee already has an assignment on this date.');
                    }
                },
            ],
            'assignment_type' => ['required', 'in:regular,overtime,swap,cover'],
            'status' => ['required', 'in:assigned,confirmed,completed,no_show,cancelled'],
            'force_assign' => ['sometimes', 'boolean'],
        ];
    }
}
