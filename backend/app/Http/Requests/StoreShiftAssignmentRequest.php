<?php

namespace App\Http\Requests;

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
                })
            ],
            'assignment_type' => ['required', 'in:regular,overtime,swap,cover'],
            'status' => ['required', 'in:assigned,confirmed,completed,no_show,cancelled'],
        ];
    }
}
