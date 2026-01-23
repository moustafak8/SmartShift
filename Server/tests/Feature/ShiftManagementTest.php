<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Shifts;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function manager_can_get_department_shifts()
    {
        $manager = User::factory()->manager()->create();
        $department = Department::factory()->create(['manager_id' => $manager->id]);
        $token = auth()->login($manager);

        Shifts::factory()->count(3)->create(['department_id' => $department->id]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token"
        ])->getJson("/api/v1/shifts/{$department->id}");

        $response->assertStatus(200);
    }
}
