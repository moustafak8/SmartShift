<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SwapRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requester_shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'target_employee_id' => ['required', 'integer', 'exists:users,id'],
            'target_shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'swap_reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'requester_shift_id.required' => 'Please select the shift you want to swap',
            'requester_shift_id.exists' => 'Selected shift does not exist',
            'target_employee_id.required' => 'Please select an employee to swap with',
            'target_employee_id.exists' => 'Selected employee does not exist',
            'target_shift_id.required' => 'Please select the target shift',
            'target_shift_id.exists' => 'Target shift does not exist',
        ];
    }
}
