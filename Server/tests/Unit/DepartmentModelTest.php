<?php

namespace Tests\Unit;

use App\Models\Department;
use App\Models\Position;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function department_belongs_to_manager()
    {
        $manager = User::factory()->manager()->create();
        $department = Department::factory()->create(['manager_id' => $manager->id]);

        $this->assertInstanceOf(User::class, $department->manager);
        $this->assertEquals($manager->id, $department->manager->id);
    }

    /* test 2 */
    public function department_can_have_multiple_employees()
    {
        $department = Department::factory()->create();
        $employee1 = User::factory()->employee()->create();
        $employee2 = User::factory()->employee()->create();

        // Create positions first
        $position1 = Position::create([
            'department_id' => $department->id,
            'name' => 'Developer',
        ]);
        $position2 = Position::create([
            'department_id' => $department->id,
            'name' => 'Designer',
        ]);

        $department->employees()->attach($employee1->id, [
            'position_id' => $position1->id,
            'is_primary' => true,
        ]);
        $department->employees()->attach($employee2->id, [
            'position_id' => $position2->id,
            'is_primary' => true,
        ]);

        $this->assertCount(2, $department->employees);
    }

    /* test 3 */
    public function department_has_many_positions()
    {
        $department = Department::factory()->create();
        Position::factory()->count(3)->create(['department_id' => $department->id]);

        $this->assertCount(3, $department->positions);
    }

    /* test 4 */
    public function department_has_correct_fillable_attributes()
    {
        $department = new Department;
        $fillable = $department->getFillable();

        $this->assertContains('name', $fillable);
        $this->assertContains('description', $fillable);
        $this->assertContains('manager_id', $fillable);
    }
}
