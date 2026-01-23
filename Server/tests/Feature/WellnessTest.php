<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\User_type;
use App\Models\WellnessEntries;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WellnessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function employee_can_view_own_wellness_entries()
    {
        $employee = User::factory()->employee()->create();
        $token = auth()->login($employee);

        WellnessEntries::factory()->count(3)->create(['employee_id' => $employee->id]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson("/api/v1/employees/{$employee->id}/wellness-entries");

        $response->assertStatus(200);
    }
}
