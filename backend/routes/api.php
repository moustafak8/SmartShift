<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeDepartmentController;
use App\Http\Controllers\ShiftsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::get('shifts', [ShiftsController::class, 'index']);
    Route::post('shifts', [ShiftsController::class, 'store']);
    Route::get('employees/{id}', [EmployeeDepartmentController::class, 'getemployees']);
    Route::get('employee/{id}/shifts', [ShiftsController::class, 'getEmployeeShifts']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('jwt');
    Route::get('me', [AuthController::class, 'me'])->middleware('jwt');

    Route::prefix('manager')->middleware('manager')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::get('employees/{id?}', [EmployeeDepartmentController::class, 'getemployees']);
    });
    Route::prefix('employee')->middleware('employee')->group(function () {
        // Employee-specific routes go here
    });
});
