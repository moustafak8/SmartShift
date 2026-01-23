<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shifts>
 */
class ShiftsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startTime = $this->faker->time('H:i:s');

        return [
            'department_id' => Department::factory(),
            'shift_template_id' => null,
            'shift_date' => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'start_time' => $startTime,
            'end_time' => date('H:i:s', strtotime($startTime) + 8 * 3600),
            'shift_type' => $this->faker->randomElement(['day', 'evening', 'night', 'rotating']),
            'required_staff_count' => $this->faker->numberBetween(2, 10),
            'notes' => $this->faker->optional()->sentence(),
            'status' => 'open',
        ];
    }
}
