<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WellnessEntries>
 */
class WellnessEntriesFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $text = $this->faker->paragraph(3);

        return [
            'employee_id' => User::factory()->employee(),
            'entry_text' => $text,
            'word_count' => str_word_count($text),
        ];
    }
}
