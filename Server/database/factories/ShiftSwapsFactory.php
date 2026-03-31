<?php

namespace Database\Factories;

use App\Models\Shifts;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ShiftSwaps>
 */
class ShiftSwapsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'requester_id' => User::factory()->employee(),
            'requester_shift_id' => Shifts::factory(),
            'target_employee_id' => User::factory()->employee(),
            'target_shift_id' => Shifts::factory(),
            'status' => 'pending',
            'swap_reason' => $this->faker->optional()->sentence(),
        ];
    }

    public function awaitingManager(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'awaiting_manager',
        ]);
    }

    public function awaitingTarget(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'awaiting_target',
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}
