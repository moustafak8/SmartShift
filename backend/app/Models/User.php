<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'email',
        'password',
        'user_type_id',
        'phone',
        'is_active',
    ];

    public function getJwtIdentifier()
    {
        return $this->getKey();
    }

    public function getJwtCustomClaims()
    {
        return [];
    }

    public function userType()
    {
        return $this->belongsTo(User_type::class, 'user_type_id');
    }

    public function departments()
    {
        return $this->belongsToMany(Department::class, 'employee__departments', 'employee_id', 'department_id')
            ->withPivot(['position_id', 'is_primary', 'joined_at'])
            ->withTimestamps();
    }

    public function employeeDepartments()
    {
        return $this->hasMany(Employee_Department::class, 'employee_id');
    }

    public function fatigueScores()
    {
        return $this->hasMany(FatigueScore::class, 'employee_id');
    }

    public function latestFatigueScore()
    {
        // Convenience relationship for grabbing the most recent score per employee
        return $this->hasOne(FatigueScore::class, 'employee_id')->latestOfMany('score_date');
    }

    public function shift_assigments()
    {
        return $this->hasMany(Shift_Assigments::class, 'employee_id');
    }

    public function shifts()
    {
        return $this->belongsToMany(Shifts::class, 'shift__assigments', 'employee_id', 'shift_id')
            ->withPivot(['assignment_type', 'status'])
            ->withTimestamps();
    }
}
