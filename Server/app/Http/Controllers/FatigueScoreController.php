<?php

namespace App\Http\Controllers;

use App\Services\ScoreService;

class FatigueScoreController extends Controller
{
    private $scoreService;

    public function __construct(ScoreService $scoreService)
    {
        $this->scoreService = $scoreService;
    }

    public function getEmployeeScore(int $employeeId)
    {
        $Score = $this->scoreService->getLatestScoreForEmployee($employeeId);

        return $this->responseJSON($Score, 'success', 200);
    }

    public function getEmployeeMonthlyScores(int $employeeId)
    {
        $scores = $this->scoreService->getMonthlyScoresForEmployee($employeeId);

        return $this->responseJSON($scores, 'success', 200);
    }
}
