<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'specific_date' => ['nullable', 'date'],
            'is_available' => ['nullable', 'boolean'],
            'preferred_shift_type' => ['nullable', 'in:day,evening,night,any'],
            'reason' => ['nullable', 'in:vacation,sick,personal,appointment,other'],
            'notes' => ['nullable', 'string', 'max:500'],
            'is_recurring' => ['nullable', 'boolean'],
        ];
    }
}
