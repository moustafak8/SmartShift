<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class JWTFromCookie
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->hasCookie('auth_token')) {
            $token = $request->cookie('auth_token');
            $request->headers->set('Authorization', 'Bearer '.$token);
        }

        return $next($request);
    }
}
