<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeDepartmentController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\ShiftTemplatesController;
use App\Http\Controllers\ShiftAssigmentsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::get('shifts', [ShiftsController::class, 'getShifts']);
    Route::post('shifts', [ShiftsController::class, 'createShift']);
    Route::get('shift-templates', [ShiftTemplatesController::class, 'getTemplates']);
    Route::post('shift-templates', [ShiftTemplatesController::class, 'createTemplate']);
    Route::get('shift-assignments', [ShiftAssigmentsController::class, 'getAssignments']);
    Route::get('shifts/{id}/assignments', [ShiftAssigmentsController::class, 'getShiftAssignments']);
    Route::post('shift-assignments', [ShiftAssigmentsController::class, 'createAssignment']);
    Route::post('shift-assignments/bulk', [ShiftAssigmentsController::class, 'createBulkAssignments']);
    Route::get('shift-assignments/week', [ShiftAssigmentsController::class, 'getWeeklyAssignments']);
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
