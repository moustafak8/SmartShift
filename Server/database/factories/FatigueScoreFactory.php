<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FatigueScore>
 */
class FatigueScoreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantitative = $this->faker->numberBetween(0, 40);
        $qualitative = $this->faker->numberBetween(0, 40);
        $psychological = $this->faker->numberBetween(0, 20);

        return [
            'employee_id' => User::factory()->employee(),
            'score_date' => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'quantitative_score' => $quantitative,
            'qualitative_score' => $qualitative,
            'psychological_score' => $psychological,
        ];
    }

    public function lowRisk(): static
    {
        return $this->state(fn (array $attributes) => [
            'quantitative_score' => 5,
            'qualitative_score' => 10,
            'psychological_score' => 5,
        ]);
    }

    public function highRisk(): static
    {
        return $this->state(fn (array $attributes) => [
            'quantitative_score' => 35,
            'qualitative_score' => 35,
            'psychological_score' => 18,
        ]);
    }
}
