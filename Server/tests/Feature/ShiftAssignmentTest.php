<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Position;
use App\Models\Shift_Assigments;
use App\Models\Shifts;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function manager_can_delete_shift_assignment()
    {
        $manager = User::factory()->manager()->create();
        $employee = User::factory()->employee()->create();
        $department = Department::factory()->create(['manager_id' => $manager->id]);
        $position = Position::create(['department_id' => $department->id, 'name' => 'Developer']);
        $shift = Shifts::factory()->create(['department_id' => $department->id]);

        $assignment = Shift_Assigments::create([
            'shift_id' => $shift->id,
            'employee_id' => $employee->id,
            'position_id' => $position->id,
            'status' => 'confirmed',
        ]);

        $token = auth()->login($manager);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token"
        ])->deleteJson("/api/v1/shift-assignments/{$assignment->id}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('shift__assigments', [
            'id' => $assignment->id,
        ]);
    }

    /* test 2 */
    public function manager_can_get_shift_assignments()
    {
        $manager = User::factory()->manager()->create();
        $employee = User::factory()->employee()->create();
        $department = Department::factory()->create(['manager_id' => $manager->id]);
        $position = Position::create(['department_id' => $department->id, 'name' => 'Developer']);
        $shift = Shifts::factory()->create(['department_id' => $department->id]);

        Shift_Assigments::create([
            'shift_id' => $shift->id,
            'employee_id' => $employee->id,
            'position_id' => $position->id,
            'status' => 'confirmed',
        ]);

        $token = auth()->login($manager);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token"
        ])->getJson('/api/v1/shift-assignments');

        $response->assertStatus(200);
    }
}
