<?php

namespace Database\Factories;

use App\Models\User_type;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'full_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'user_type_id' => User_type::factory(),
            'phone' => $this->faker->phoneNumber(),
            'is_active' => true,
        ];
    }

    public function manager(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type_id' => 1,
        ]);
    }

    public function employee(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type_id' => 2,
        ]);
    }
}
