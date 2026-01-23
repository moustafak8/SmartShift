<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\User_type;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User_type::create(['id' => 1, 'role_name' => 'manager']);
        User_type::create(['id' => 2, 'role_name' => 'employee']);
    }

    /* test 1 */
    public function user_cannot_login_with_invalid_credentials()
    {
        $user = User::factory()->manager()->create([
            'email' => 'manager@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'manager@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    /* test 2 */
    public function unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/v1/me');

        $response->assertStatus(401);
    }
}
