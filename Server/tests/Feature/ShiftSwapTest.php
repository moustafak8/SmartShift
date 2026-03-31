<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Shifts;
use App\Models\ShiftSwaps;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ShiftSwapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /** @test */
    public function employee_can_view_outgoing_swaps()
    {
        $employee = User::factory()->employee()->create();
        $token = JWTAuth::fromUser($employee);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson('/api/v1/shift-swaps/outgoing');

        $response->assertStatus(200);
    }

    /** @test */
    public function employee_can_view_incoming_swaps()
    {
        $employee = User::factory()->employee()->create();
        $token = JWTAuth::fromUser($employee);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson('/api/v1/shift-swaps/incoming');

        $response->assertStatus(200);
    }

    /** @test */
    public function manager_can_view_swaps_awaiting_review()
    {
        $manager = User::factory()->manager()->create();
        $token = JWTAuth::fromUser($manager);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson('/api/v1/shift-swaps/awaiting-manager');

        $response->assertStatus(200);
    }

    /** @test */
    public function manager_can_get_pending_swap_count()
    {
        $manager = User::factory()->manager()->create();
        $token = JWTAuth::fromUser($manager);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson('/api/v1/shift-swaps/pending-count');

        $response->assertStatus(200);
        $response->assertJsonStructure(['payload' => ['count']]);
    }

    /** @test */
    public function manager_can_reject_a_swap_awaiting_review()
    {
        $manager = User::factory()->manager()->create();
        $requester = User::factory()->employee()->create();
        $target = User::factory()->employee()->create();
        $department = Department::factory()->create(['manager_id' => $manager->id]);

        $requesterShift = Shifts::factory()->create(['department_id' => $department->id]);
        $targetShift = Shifts::factory()->create(['department_id' => $department->id]);

        $swap = ShiftSwaps::create([
            'requester_id' => $requester->id,
            'requester_shift_id' => $requesterShift->id,
            'target_employee_id' => $target->id,
            'target_shift_id' => $targetShift->id,
            'status' => 'awaiting_manager',
        ]);

        $token = JWTAuth::fromUser($manager);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->postJson("/api/v1/shift-swaps/{$swap->id}/review", [
            'decision' => 'reject',
            'notes' => 'Staffing levels do not permit this swap.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('shift_swaps', [
            'id' => $swap->id,
            'status' => 'rejected',
        ]);
    }

    /** @test */
    public function employee_can_cancel_their_pending_swap()
    {
        $requester = User::factory()->employee()->create();
        $target = User::factory()->employee()->create();

        $requesterShift = Shifts::factory()->create();
        $targetShift = Shifts::factory()->create();

        $swap = ShiftSwaps::create([
            'requester_id' => $requester->id,
            'requester_shift_id' => $requesterShift->id,
            'target_employee_id' => $target->id,
            'target_shift_id' => $targetShift->id,
            'status' => 'pending',
        ]);

        $token = JWTAuth::fromUser($requester);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->postJson("/api/v1/shift-swaps/{$swap->id}/cancel");

        $response->assertStatus(200);
        $this->assertDatabaseHas('shift_swaps', [
            'id' => $swap->id,
            'status' => 'cancelled',
        ]);
    }

    /** @test */
    public function employee_cannot_cancel_another_employees_swap()
    {
        $requester = User::factory()->employee()->create();
        $otherEmployee = User::factory()->employee()->create();
        $target = User::factory()->employee()->create();

        $requesterShift = Shifts::factory()->create();
        $targetShift = Shifts::factory()->create();

        $swap = ShiftSwaps::create([
            'requester_id' => $requester->id,
            'requester_shift_id' => $requesterShift->id,
            'target_employee_id' => $target->id,
            'target_shift_id' => $targetShift->id,
            'status' => 'pending',
        ]);

        $token = JWTAuth::fromUser($otherEmployee);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->postJson("/api/v1/shift-swaps/{$swap->id}/cancel");

        $response->assertStatus(400);
        $this->assertDatabaseHas('shift_swaps', [
            'id' => $swap->id,
            'status' => 'pending',
        ]);
    }
}
