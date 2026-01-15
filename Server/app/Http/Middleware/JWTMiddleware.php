<?php

namespace App\Http\Middleware;

use App\Traits\ResponseTrait;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class JWTMiddleware
{
    use ResponseTrait;

    public function handle(Request $request, Closure $next): Response
    {
        try {
            $token = $request->bearerToken() ?? $request->cookie('auth_token');

            if (! $token) {
                return $this->responseJSON('Token not provided', 'error', 401);
            }

            JWTAuth::setToken($token);
            $user = JWTAuth::authenticate();

            if (! $user) {
                return $this->responseJSON('User not found', 'error', 401);
            }

            return $next($request);
        } catch (JWTException $e) {
            return $this->responseJSON('Invalid token: '.$e->getMessage(), 'error', 401);
        } catch (\Exception $e) {
            return $this->responseJSON('Unauthorized: '.$e->getMessage(), 'error', 401);
        }
    }
}
