<?php

namespace App\Services;

use App\Models\FatigueScore;

class ScoreService
{
    public function getLatestScoreForEmployee(int $employeeId): array
    {
        $score = FatigueScore::where('employee_id', $employeeId)
            ->orderByDesc('score_date')
            ->firstOrFail();

        return [
            'employee_id' => $score->employee_id,
            'total_score' => (int) $score->total_score,
            'risk_level' => $score->risk_level,
            'breakdown' => [
                'schedule_pressure' => [
                    'weight' => 40,
                    'score' => (int) $score->quantitative_score,
                ],
                'physical_wellness' => [
                    'weight' => 40,
                    'score' => (int) $score->qualitative_score,
                ],
                'mental_health' => [
                    'weight' => 20,
                    'score' => (int) $score->psychological_score,
                ],
            ],
        ];
    }
}
