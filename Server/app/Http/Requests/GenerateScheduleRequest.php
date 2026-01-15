<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id' => 'required|integer|exists:departments,id',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ];
    }

    public function messages(): array
    {
        return [
            'department_id.required' => 'Department is required',
            'department_id.exists' => 'Department does not exist',
            'start_date.required' => 'Start date is required',
            'start_date.date_format' => 'Start date must be in Y-m-d format',
            'end_date.required' => 'End date is required',
            'end_date.date_format' => 'End date must be in Y-m-d format',
            'end_date.after_or_equal' => 'End date must be after or equal to start date',
        ];
    }

    public function getDepartmentId(): int
    {
        return (int) $this->input('department_id');
    }

    public function getStartDate(): string
    {
        return $this->input('start_date');
    }

    public function getEndDate(): string
    {
        return $this->input('end_date');
    }
}
