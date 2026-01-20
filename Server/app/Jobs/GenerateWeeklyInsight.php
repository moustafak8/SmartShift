<?php

namespace App\Jobs;

use App\Models\Department;
use App\Services\InsightService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateWeeklyInsight implements ShouldQueue
{
    use Queueable;

    public function handle(InsightService $insightService): void
    {
        Department::whereNotNull('manager_id')
            ->get()
            ->each(fn ($dept) => rescue(fn () => $insightService->generateWeeklyInsight($dept->id)));
    }
}
