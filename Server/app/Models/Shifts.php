<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shifts extends Model
{
    /** @use HasFactory<\Database\Factories\ShiftsFactory> */
    use HasFactory;

    protected $fillable = [
        'department_id',
        'shift_template_id',
        'shift_date',
        'start_time',
        'end_time',
        'shift_type',
        'required_staff_count',
        'notes',
        'status',
    ];

    protected $casts = [
        'shift_date' => 'date',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function employees()
    {
        return $this->belongsToMany(User::class, 'shift__assigments', 'shift_id', 'employee_id')
            ->withPivot(['assignment_type', 'status'])
            ->withTimestamps();
    }

    public function positionRequirements()
    {
        return $this->hasMany(Shift_Position_Requirement::class, 'shift_id');
    }

    public function shiftAssigments()
    {
        return $this->hasMany(Shift_Assigments::class, 'shift_id');
    }

    public function shiftTemplate()
    {
        return $this->belongsTo(Shift_Template::class, 'shift_template_id');
    }
}
