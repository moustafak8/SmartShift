<?php

namespace Database\Factories;

use App\Models\Shifts;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shift_Assigments>
 */
class ShiftAssigmentsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'shift_id' => Shifts::factory(),
            'employee_id' => User::factory()->employee(),
            'assignment_type' => $this->faker->randomElement(['regular', 'overtime', 'backup']),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'cancelled']),
        ];
    }
}
