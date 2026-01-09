<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeePreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'preferred_shift_types' => ['nullable', 'array'],
            'preferred_shift_types.*' => ['string', 'in:day,evening,night'],
            'max_shifts_per_week' => ['nullable', 'integer', 'min:1', 'max:7'],
            'max_hours_per_week' => ['nullable', 'integer', 'min:1', 'max:168'],
            'max_consecutive_days' => ['nullable', 'integer', 'min:1', 'max:7'],
            'prefers_weekends' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
