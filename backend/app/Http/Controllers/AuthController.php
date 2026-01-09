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

            return $this->responseJSON([
                'user' => $user,
            ], 'success', 200);
        } catch (\Exception $e) {
            return $this->responseJSON(
                'Unauthorized',
                'error',
                401
            );
        }
    }
}
