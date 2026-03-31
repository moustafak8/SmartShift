<?php

namespace Tests\Unit;

use App\Models\FatigueScore;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FatigueScoreModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /** @test */
    public function fatigue_score_belongs_to_employee()
    {
        $employee = User::factory()->employee()->create();
        $score = FatigueScore::factory()->create(['employee_id' => $employee->id]);

        $this->assertInstanceOf(User::class, $score->employee);
        $this->assertEquals($employee->id, $score->employee->id);
    }

    /** @test */
    public function fatigue_score_has_correct_fillable_attributes()
    {
        $score = new FatigueScore;
        $fillable = $score->getFillable();

        $this->assertContains('employee_id', $fillable);
        $this->assertContains('score_date', $fillable);
        $this->assertContains('quantitative_score', $fillable);
        $this->assertContains('qualitative_score', $fillable);
        $this->assertContains('psychological_score', $fillable);
    }

    /** @test */
    public function fatigue_score_total_is_sum_of_components()
    {
        $employee = User::factory()->employee()->create();

        $score = FatigueScore::create([
            'employee_id' => $employee->id,
            'score_date' => now()->format('Y-m-d'),
            'quantitative_score' => 20,
            'qualitative_score' => 15,
            'psychological_score' => 10,
        ]);

        $score->refresh();
        $this->assertEquals(45, $score->total_score);
    }

    /** @test */
    public function risk_level_is_low_for_scores_up_to_30()
    {
        $employee = User::factory()->employee()->create();

        $score = FatigueScore::create([
            'employee_id' => $employee->id,
            'score_date' => now()->format('Y-m-d'),
            'quantitative_score' => 10,
            'qualitative_score' => 10,
            'psychological_score' => 5,
        ]);

        $score->refresh();
        $this->assertEquals('low', $score->risk_level);
    }

    /** @test */
    public function risk_level_is_medium_for_scores_between_31_and_60()
    {
        $employee = User::factory()->employee()->create();

        $score = FatigueScore::create([
            'employee_id' => $employee->id,
            'score_date' => now()->format('Y-m-d'),
            'quantitative_score' => 20,
            'qualitative_score' => 20,
            'psychological_score' => 10,
        ]);

        $score->refresh();
        $this->assertEquals('medium', $score->risk_level);
    }

    /** @test */
    public function risk_level_is_high_for_scores_above_60()
    {
        $employee = User::factory()->employee()->create();

        $score = FatigueScore::create([
            'employee_id' => $employee->id,
            'score_date' => now()->format('Y-m-d'),
            'quantitative_score' => 35,
            'qualitative_score' => 30,
            'psychological_score' => 15,
        ]);

        $score->refresh();
        $this->assertEquals('high', $score->risk_level);
    }
}
