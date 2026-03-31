<?php

namespace Tests\Feature;

use App\Models\FatigueScore;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class FatigueScoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /** @test */
    public function employee_can_get_their_latest_fatigue_score()
    {
        $employee = User::factory()->employee()->create();
        $token = JWTAuth::fromUser($employee);

        FatigueScore::create([
            'employee_id' => $employee->id,
            'score_date' => now()->subDays(2)->format('Y-m-d'),
            'quantitative_score' => 15,
            'qualitative_score' => 10,
            'psychological_score' => 5,
        ]);

        FatigueScore::create([
            'employee_id' => $employee->id,
            'score_date' => now()->format('Y-m-d'),
            'quantitative_score' => 20,
            'qualitative_score' => 15,
            'psychological_score' => 10,
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson("/api/v1/fatigue-scores/{$employee->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('payload.total_score', 45);
    }

    /** @test */
    public function employee_can_get_monthly_fatigue_scores()
    {
        $employee = User::factory()->employee()->create();
        $token = JWTAuth::fromUser($employee);

        FatigueScore::create([
            'employee_id' => $employee->id,
            'score_date' => now()->subDays(10)->format('Y-m-d'),
            'quantitative_score' => 10,
            'qualitative_score' => 10,
            'psychological_score' => 5,
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson("/api/v1/fatigue-scores/{$employee->id}/monthly");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'payload' => [
                'employee_id',
                'scores',
            ],
        ]);
    }
}
