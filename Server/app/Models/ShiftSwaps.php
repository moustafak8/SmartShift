<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftSwaps extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id',
        'requester_shift_id',
        'target_employee_id',
        'target_shift_id',
        'status',
        'swap_reason',
        'validation_passed',
        'validation_notes',
        'requester_new_fatigue_score',
        'target_new_fatigue_score',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'validation_passed' => 'boolean',
        'validation_notes' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function requesterShift(): BelongsTo
    {
        return $this->belongsTo(Shifts::class, 'requester_shift_id');
    }

    public function targetEmployee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_employee_id');
    }

    public function targetShift(): BelongsTo
    {
        return $this->belongsTo(Shifts::class, 'target_shift_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
