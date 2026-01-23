<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\User_type;
use App\Models\WellnessEntries;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WellnessModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function wellness_entry_belongs_to_employee()
    {
        $employee = User::factory()->employee()->create();
        $entry = WellnessEntries::factory()->create(['employee_id' => $employee->id]);

        $this->assertInstanceOf(User::class, $entry->employee);
        $this->assertEquals($employee->id, $entry->employee->id);
    }

    /* test 2 */
    public function wellness_entry_has_correct_fillable_attributes()
    {
        $entry = new WellnessEntries;
        $fillable = $entry->getFillable();

        $this->assertContains('employee_id', $fillable);
        $this->assertContains('entry_text', $fillable);
        $this->assertContains('word_count', $fillable);
    }

    /* test 3 */
    public function can_create_wellness_entry_with_word_count()
    {
        $employee = User::factory()->employee()->create();
        $text = 'I feel great today. Very energetic and motivated.';

        $entry = WellnessEntries::create([
            'employee_id' => $employee->id,
            'entry_text' => $text,
            'word_count' => str_word_count($text),
        ]);

        $this->assertEquals(8, $entry->word_count);
        $this->assertDatabaseHas('wellness_entries', [
            'employee_id' => $employee->id,
            'word_count' => 8,
        ]);
    }
}
