<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WellnessEntries extends Model
{
    /** @use HasFactory<\Database\Factories\WellnessEntriesFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'entry_text',
        'word_count',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function vector()
    {
        return $this->hasOne(WellnessEntryVector::class, 'entry_id');
    }

    public function employeeDepartments()
    {
        return $this->hasMany(Employee_Department::class, 'employee_id', 'employee_id');
    }
}
