<?php

namespace App\Jobs;

use App\Models\Department;
use App\Services\InsightService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateWeeklyInsight implements ShouldQueue
{
    use Queueable;

  
}
