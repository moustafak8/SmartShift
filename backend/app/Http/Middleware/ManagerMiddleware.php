<?php

namespace App\Http\Middleware;

use App\Traits\ResponseTrait;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class ManagerMiddleware
{
    use ResponseTrait;

    public function handle(Request $request, Closure $next): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return $this->responseJSON('User not found', 401);
            }

            if ($user->user_type_id != 1) {
                return $this->responseJSON('Unauthorized. Manager access only.', 403);
            }

            return $next($request);
        } catch (\Exception $e) {
            return $this->responseJSON('Unauthorized: '.$e->getMessage(), 401);
        }
    }
}
