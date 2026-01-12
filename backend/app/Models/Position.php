<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    /** @use HasFactory<\Database\Factories\PositionFactory> */
    use HasFactory;

    protected $fillable = [
        'department_id',
        'name',
        'description',
    ];



    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee_Department::class, 'position_id');
    }

    public function shiftRequirements()
    {
        return $this->hasMany(Shift_Position_Requirement::class, 'position_id');
    }
}
