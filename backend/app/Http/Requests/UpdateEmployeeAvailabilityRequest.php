<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_available' => ['nullable', 'boolean'],
            'preferred_shift_type' => ['nullable', 'in:day,evening,night,any'],
            'reason' => ['nullable', 'in:vacation,sick,personal,appointment,other'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
