<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee_Department extends Model
{
    use HasFactory;

    protected $table = 'employee__departments';

    protected $fillable = [
        'employee_id',
        'department_id',
        'is_primary',
        'joined_at',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
