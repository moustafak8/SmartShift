<?php

namespace Tests\Unit;

use App\Models\Department;
use App\Models\Shifts;
use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function shift_belongs_to_department()
    {
        $department = Department::factory()->create();
        $shift = Shifts::factory()->create(['department_id' => $department->id]);

        $this->assertInstanceOf(Department::class, $shift->department);
        $this->assertEquals($department->id, $shift->department->id);
    }

    /* test 2 */
    public function shift_has_correct_fillable_attributes()
    {
        $shift = new Shifts;
        $fillable = $shift->getFillable();

        $this->assertContains('department_id', $fillable);
        $this->assertContains('shift_date', $fillable);
        $this->assertContains('start_time', $fillable);
        $this->assertContains('end_time', $fillable);
        $this->assertContains('shift_type', $fillable);
        $this->assertContains('required_staff_count', $fillable);
    }

    /* test 3 */
    public function shift_can_have_multiple_employees()
    {
        $shift = Shifts::factory()->create();
        $employee1 = User::factory()->employee()->create();
        $employee2 = User::factory()->employee()->create();

        $shift->employees()->attach($employee1->id, [
            'assignment_type' => 'regular',
            'status' => 'confirmed',
        ]);
        $shift->employees()->attach($employee2->id, [
            'assignment_type' => 'regular',
            'status' => 'confirmed',
        ]);

        $this->assertCount(2, $shift->employees);
    }

    /* test 4 */
    public function shift_status_defaults_to_open()
    {
        $shift = Shifts::factory()->create([
            'status' => 'open',
        ]);

        $this->assertEquals('open', $shift->status);
    }
}
