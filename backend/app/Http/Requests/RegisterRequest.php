<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'min:8'],
            'user_type_id' => ['required', 'integer', 'exists:user_types,id'],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
            'department_id' => ['required_if:user_type_id,2', 'exists:departments,id'],
            'position_id' => ['required_if:user_type_id,2', 'exists:positions,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Full name is required',
            'email.required' => 'Email address is required',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email is already registered',
            'password.required' => 'Password is required',
            'user_type_id.required' => 'User type is required',
            'user_type_id.exists' => 'Invalid user type selected',
        ];
    }
}
