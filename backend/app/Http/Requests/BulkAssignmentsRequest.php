<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkAssignmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assignments' => ['required', 'array', 'min:1'],
            'assignments.*.shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'assignments.*.employee_id' => ['required', 'integer', 'exists:users,id'],
            'assignments.*.assignment_type' => ['required', 'in:regular,overtime,swap,cover'],
            'assignments.*.status' => ['required', 'in:assigned,confirmed,completed,no_show,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'assignments.required' => 'Assignments array is required.',
            'assignments.min' => 'At least one assignment is required.',
        ];
    }
}
