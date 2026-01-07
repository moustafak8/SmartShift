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
}
