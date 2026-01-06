<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterRequest $request)
    {
        $user = $this->authService->registerUser($request->validated());
        if (! $user) {
            return $this->responseJSON(
                'Registration failed. Please try again later.',
                'error',
                500
            );
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

        // Set HTTP-only cookie with JWT token
        cookie()->queue(
            'auth_token',
            $result['token'],
            60 * 24 * 7,           // 7 days (in minutes)
            '/',
            null,
            config('app.env') === 'production', // Secure (HTTPS only in production)
            true,
            false,
            'strict'
        );

        return $this->responseJSON([
            'message' => 'User logged in successfully',
            'user' => $result['user'],
        ], 'success', 200);
    }

    public function logout()
    {
        $this->authService->logout();

        cookie()->queue(cookie()->forget('auth_token'));

        return $this->responseJSON('Successfully logged out', 'success', 200);
    }

    public function me()
    {
        $user = JWTAuth::user();

        return $this->responseJSON([
            'user' => $user,
        ], 'success', 200);
    }
}
