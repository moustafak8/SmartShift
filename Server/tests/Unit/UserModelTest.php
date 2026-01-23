<?php

namespace Tests\Unit;

use App\Models\Department;
use App\Models\Position;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /** @test */
    public function user_belongs_to_user_type()
    {
        $user = User::factory()->manager()->create();

        $this->assertInstanceOf(User_type::class, $user->userType);
        $this->assertEquals('manager', $user->userType->role_name);
    }

    /** @test */
    public function user_can_belong_to_multiple_departments()
    {
        $user = User::factory()->employee()->create();
        $department1 = Department::factory()->create();
        $department2 = Department::factory()->create();

        // Create positions first
        $position1 = Position::create([
            'department_id' => $department1->id,
            'name' => 'Developer',
        ]);
        $position2 = Position::create([
            'department_id' => $department2->id,
            'name' => 'Designer',
        ]);

        $user->departments()->attach($department1->id, [
            'position_id' => $position1->id,
            'is_primary' => true,
        ]);
        $user->departments()->attach($department2->id, [
            'position_id' => $position2->id,
            'is_primary' => false,
        ]);

        $this->assertCount(2, $user->departments);
    }

    /** @test */
    public function manager_can_have_managed_departments()
    {
        $manager = User::factory()->manager()->create();
        $department = Department::factory()->create(['manager_id' => $manager->id]);

        $this->assertCount(1, $manager->managedDepartments);
        $this->assertEquals($department->id, $manager->managedDepartments->first()->id);
    }

    /** @test */
    public function user_has_correct_fillable_attributes()
    {
        $user = new User;
        $fillable = $user->getFillable();

        $this->assertContains('full_name', $fillable);
        $this->assertContains('email', $fillable);
        $this->assertContains('password', $fillable);
        $this->assertContains('user_type_id', $fillable);
        $this->assertContains('phone', $fillable);
    }

    /** @test */
    public function user_can_generate_jwt_identifier()
    {
        $user = User::factory()->create();

        $this->assertEquals($user->id, $user->getJwtIdentifier());
    }
}
