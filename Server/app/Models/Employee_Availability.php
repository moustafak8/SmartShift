<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee_Availability extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeAvailabilityFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'day_of_week',
        'specific_date',
        'is_available',
        'preferred_shift_type',
        'reason',
        'notes',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'specific_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
