<?php

namespace Tests\Unit;

use App\Models\Department;
use App\Models\Position;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PositionModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
    }

    /** @test */
    public function position_belongs_to_department()
    {
        $department = Department::factory()->create();
        $position = Position::factory()->create(['department_id' => $department->id]);

        $this->assertInstanceOf(Department::class, $position->department);
        $this->assertEquals($department->id, $position->department->id);
    }

    /** @test */
    public function position_has_correct_fillable_attributes()
    {
        $position = new Position;
        $fillable = $position->getFillable();

        $this->assertContains('department_id', $fillable);
        $this->assertContains('name', $fillable);
    }

    /** @test */
    public function can_create_position_with_valid_data()
    {
        $department = Department::factory()->create();

        $position = Position::create([
            'department_id' => $department->id,
            'name' => 'Software Engineer',
        ]);

        $this->assertDatabaseHas('positions', [
            'name' => 'Software Engineer',
            'department_id' => $department->id,
        ]);
    }
}
