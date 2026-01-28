<?php

use App\Http\Middleware\EmployeeMiddleware;
use App\Http\Middleware\JWTFromCookie;
use App\Http\Middleware\JWTMiddleware;
use App\Http\Middleware\ManagerMiddleware;
use App\Jobs\GenerateWeeklyInsight;
use App\Traits\ResponseTrait;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->job(new GenerateWeeklyInsight)->sundays()->at('20:00');
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(JWTFromCookie::class);

        $middleware->alias([
            'employee' => EmployeeMiddleware::class,
            'manager' => ManagerMiddleware::class,
            'jwt' => JWTMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $isApiRequest = fn($request) => $request->is('api/*') || $request->expectsJson();

        $exceptions->render(function (ModelNotFoundException $e, $request) use ($isApiRequest) {
            if ($isApiRequest($request)) {
                return ResponseTrait::responseJSON('Resource not found', 'error', 404);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, $request) use ($isApiRequest) {
            if ($isApiRequest($request)) {
                return ResponseTrait::responseJSON('Endpoint not found', 'error', 404);
            }
        });

        $exceptions->render(function (ValidationException $e, $request) use ($isApiRequest) {
            if ($isApiRequest($request)) {
                return ResponseTrait::responseJSON($e->errors(), 'error', 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, $request) use ($isApiRequest) {
            if ($isApiRequest($request)) {
                return ResponseTrait::responseJSON('Unauthenticated', 'error', 401);
            }
        });

        $exceptions->render(function (HttpException $e, $request) use ($isApiRequest) {
            if ($isApiRequest($request)) {
                return ResponseTrait::responseJSON($e->getMessage() ?: 'An error occurred', 'error', $e->getStatusCode());
            }
        });

        $exceptions->render(function (QueryException $e, $request) use ($isApiRequest) {
            if ($isApiRequest($request)) {
                return ResponseTrait::responseJSON('Database error occurred', 'error', 500);
            }
        });

        $exceptions->render(function (\Throwable $e, $request) use ($isApiRequest) {
            if ($isApiRequest($request)) {
                return ResponseTrait::responseJSON('An unexpected error occurred', 'error', 500);
            }
        });
    })->create();
