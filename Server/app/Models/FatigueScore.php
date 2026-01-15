<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FatigueScore extends Model
{
    /** @use HasFactory<\Database\Factories\FatigueScoreFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'score_date',
        'quantitative_score',
        'qualitative_score',
        'psychological_score',
        'total_score',
        'risk_level',
    ];

    protected $casts = [
        'score_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
