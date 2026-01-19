<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIInsights extends Model
{
    /** @use HasFactory<\Database\Factories\AIInsightsFactory> */
    use HasFactory;

    protected $table = 'ai_insights';

    protected $fillable = [
        'department_id',
        'insight_type',
        'title',
        'content',
        'priority',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
