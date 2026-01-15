<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WellnessEntryVector extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'qdrant_point_id',
        'sentiment_score',
        'sentiment_label',
        'detected_keywords',
        'is_flagged',
        'flag_reason',
        'flag_severity',
    ];

    protected $casts = [
        'detected_keywords' => 'array',
        'sentiment_score' => 'float',
        'is_flagged' => 'boolean',
    ];

    public function entry(): BelongsTo
    {
        return $this->belongsTo(WellnessEntries::class, 'entry_id');
    }
}
