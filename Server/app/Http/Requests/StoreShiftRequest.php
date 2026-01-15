<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'shift_template_id' => ['nullable', 'integer', 'exists:shift__templates,id'],
            'shift_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'shift_type' => ['required', 'in:day,evening,night,rotating'],
            'required_staff_count' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'status' => ['required', 'in:open,filled,understaffed,cancelled'],
            // Recurrence fields
            'is_recurring' => ['boolean'],
            'recurrence_type' => ['nullable', 'required_if:is_recurring,true', 'in:daily,weekly,monthly'],
            'recurrence_end_date' => ['nullable', 'required_if:is_recurring,true', 'date', 'after:shift_date'],
            'position_requirements' => ['nullable', 'array'],
            'position_requirements.*.position_id' => ['required', 'integer', 'exists:positions,id'],
            'position_requirements.*.required_count' => ['required', 'integer', 'min:1'],
        ];
    }
}
