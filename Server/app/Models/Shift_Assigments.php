<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift_Assigments extends Model
{
    /** @use HasFactory<\Database\Factories\ShiftAssigmentsFactory> */
    use HasFactory;

    protected $table = 'shift__assigments';

    protected $fillable = [
        'shift_id',
        'employee_id',
        'assignment_type',
        'status',
    ];

    public function shift()
    {
        return $this->belongsTo(Shifts::class, 'shift_id');
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
