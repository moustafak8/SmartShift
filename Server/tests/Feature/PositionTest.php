<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Position;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PositionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function can_get_all_positions()
    {
        Position::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/positions');

        $response->assertStatus(200);
    }

    /* test 2 */
    public function can_create_position()
    {
        $department = Department::factory()->create();

        $response = $this->postJson('/api/v1/positions', [
            'department_id' => $department->id,
            'name' => 'Software Engineer',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('positions', [
            'name' => 'Software Engineer',
            'department_id' => $department->id,
        ]);
    }

    /* test 3 */
    public function can_update_position()
    {
        $position = Position::factory()->create();

        $response = $this->putJson("/api/v1/positions/{$position->id}", [
            'department_id' => $position->department_id,
            'name' => 'Senior Developer',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('positions', [
            'id' => $position->id,
            'name' => 'Senior Developer',
        ]);
    }

    /* test 4 */
    public function can_delete_position()
    {
        $position = Position::factory()->create();

        $response = $this->deleteJson("/api/v1/positions/{$position->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('positions', [
            'id' => $position->id,
        ]);
    }

    /** @test */
    public function manager_can_get_positions_by_department()
    {
        $manager = User::factory()->manager()->create();
        $department = Department::factory()->create(['manager_id' => $manager->id]);
        $token = auth()->login($manager);

        Position::factory()->count(3)->create(['department_id' => $department->id]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token"
        ])->getJson("/api/v1/departments/{$department->id}/positions");

        $response->assertStatus(200);
    }
}
