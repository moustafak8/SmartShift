<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use App\Services\EmployeeDepartmentService;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private EmployeeDepartmentService $employeeDepartmentService
    ) {}

    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();

        // Create the user
        $user = $this->authService->registerUser($validated);
        if (! $user) {
            return $this->responseJSON(
                'Registration failed. Please try again later.',
                'error',
                500
            );
        }

        // If registering an employee, assign to department with position
        if ($validated['user_type_id'] == 2) {
            try {
                $this->employeeDepartmentService->assignEmployeeToDepartment([
                    'employee_id' => $user->id,
                    'department_id' => $validated['department_id'],
                    'position_id' => $validated['position_id'],
                    'is_primary' => true,
                ]);
            } catch (\Exception $e) {
                return $this->responseJSON(
                    'Failed to assign employee to department: ' . $e->getMessage(),
                    'error',
                    500
                );
            }
        }

        return $this->responseJSON([
            'message' => 'User registered successfully',
            'user' => $user,
        ], 'success', 201);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());
        if (! $result) {
            return $this->responseJSON(
                'Invalid email or password',
                'error',
                401
            );
        }

        $cookie = cookie(
            'auth_token',
            $result['token'],
            60 * 24 * 7,
            '/',
            '',
            false,
            true,
            false,
            'lax'
        );

        $response = $this->responseJSON([
            'message' => 'User logged in successfully',
            'user' => $result['user'],
            'department_id' => $result['department_id'],
        ], 'success', 200);

        return $response->withCookie($cookie);
    }

    public function logout()
    {
        $this->authService->logout();

        $response = $this->responseJSON('Successfully logged out', 'success', 200);

        return $response->withCookie(cookie()->forget('auth_token'));
    }

    public function me()
    {
        try {
            $user = JWTAuth::user();

            if (! $user) {
                return $this->responseJSON(
                    'Token invalid or expired',
                    'error',
                    401
                );
            }

            $response = ['user' => $user];
            if ($user->user_type_id == 1) {
                $department = $user->managedDepartments()->first();
                $response['department_id'] = $department ? $department->id : null;
            }

            return $this->responseJSON($response, 'success', 200);
        } catch (\Exception $e) {
            return $this->responseJSON(
                'Unauthorized',
                'error',
                401
            );
        }
    }
}
