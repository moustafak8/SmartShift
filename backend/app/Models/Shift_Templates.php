<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift_Templates extends Model
{
    /** @use HasFactory<\Database\Factories\ShiftTemplatesFactory> */
    use HasFactory;

    protected $table = 'shift__templates';

    protected $fillable = [
        'name',
        'shift_type',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
