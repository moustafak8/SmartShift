<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WellnessEntryExtraction extends Model
{
    /** @use HasFactory<\Database\Factories\WellnessEntryExtractionFactory> */
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'shift_duration_hours',
        'shift_type',
        'sleep_hours_before',
        'sleep_quality_rating',
        'meals_count',
        'meal_quality',
        'stress_level',
        'mood_rating',
        'physical_symptoms',
        'concerns_mentioned',
        'parsing_confidence',
    ];

    protected $casts = [
        'physical_symptoms' => 'array',
        'concerns_mentioned' => 'array',
        'shift_duration_hours' => 'decimal:2',
        'sleep_hours_before' => 'decimal:1',
        'parsing_confidence' => 'decimal:2',
    ];

    public function entry()
    {
        return $this->belongsTo(WellnessEntries::class, 'entry_id');
    }
}
