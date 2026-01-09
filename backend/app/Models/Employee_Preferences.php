<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee_Preferences extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeePreferencesFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'preferred_shift_types',
        'max_shifts_per_week',
        'max_hours_per_week',
        'max_consecutive_days',
        'prefers_weekends',
        'notes',
    ];

    protected $casts = [
        'preferred_shift_types' => 'json',
        'prefers_weekends' => 'boolean',
    ];
}
