<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeAvailabilityController;
use App\Http\Controllers\EmployeeDepartmentController;
use App\Http\Controllers\EmployeePreferencesController;
use App\Http\Controllers\FatigueScoreController;
use App\Http\Controllers\GenerateScheduleController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\ShiftAssigmentsController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\ShiftSwapsController;
use App\Http\Controllers\ShiftTemplatesController;
use App\Http\Controllers\WellnessEntriesController;
use App\Http\Controllers\WellnessSearchController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('shift-templates', [ShiftTemplatesController::class, 'createTemplate']);
    Route::get('employees/{employeeId}/shift-assignments/week', [ShiftAssigmentsController::class, 'getWeeklyAssignmentsByEmployee']);
    Route::post('wellness/search', [WellnessSearchController::class, 'search']);
    Route::get('positions', [PositionController::class, 'getAllPositions']);
    Route::post('positions', [PositionController::class, 'storePosition']);
    Route::put('positions/{positionId}', [PositionController::class, 'updatePosition']);
    Route::delete('positions/{positionId}', [PositionController::class, 'deletePosition']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('jwt');
    Route::get('me', [AuthController::class, 'me'])->middleware('jwt');
    
    Route::prefix('agent')->middleware('jwt')->group(function () {
        Route::get('employees/{id}', [AgentController::class, 'getEmployee']);
        Route::get('employees/{employeeId}/availability', [AgentController::class, 'getEmployeeAvailability']);
        Route::get('fatigue-scores/{employeeId}', [AgentController::class, 'getFatigueScore']);
        Route::get('shifts/{id}', [AgentController::class, 'getShift']);
        Route::get('shifts/{shiftId}/assignments', [AgentController::class, 'getShiftAssignments']);
    });

    Route::prefix('')->middleware('manager')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::get('employees/{departmentId}', [EmployeeDepartmentController::class, 'getemployees']);
        Route::get('shifts/{departmentId}', [ShiftsController::class, 'getShifts']);
        Route::post('shifts', [ShiftsController::class, 'createShift']);
        Route::get('shift-templates', [ShiftTemplatesController::class, 'getTemplates']);
        Route::post('shift-assignments', [ShiftAssigmentsController::class, 'createAssignment']);
        Route::post('shift-assignments/bulk', [ShiftAssigmentsController::class, 'createBulkAssignments']);
        Route::put('shift-assignments/{assignmentId}', [ShiftAssigmentsController::class, 'updateAssignment']);
        Route::delete('shift-assignments/{assignmentId}', [ShiftAssigmentsController::class, 'deleteAssignment']);
        Route::get('shift-assignments', [ShiftAssigmentsController::class, 'getAssignments']);
        Route::get('shifts/{id}/assignments', [ShiftAssigmentsController::class, 'getShiftAssignments']);
        Route::get('shift-assignments/week', [ShiftAssigmentsController::class, 'getWeeklyAssignments']);
        Route::get('wellness-entries/{departmentId}', [WellnessEntriesController::class, 'getEntries']);
        Route::post('wellness/search/insights', [WellnessSearchController::class, 'searchWithInsights']);
        Route::get('departments/{departmentId}/available-employees', [EmployeeAvailabilityController::class, 'getAvailableEmployeesForDate']);
        Route::post('schedules/generate', [GenerateScheduleController::class, 'generate']);
        Route::post('schedules/save-reviewed', [GenerateScheduleController::class, 'saveReviewed']);
        Route::get('departments/{departmentId}/positions', [PositionController::class, 'getPositionsByDepartment']);
        Route::get('positions/{positionId}', [PositionController::class, 'getPositionById']);
        Route::get('shift-swaps', [ShiftSwapsController::class, 'index']);
        Route::get('shift-swaps/pending-count', [ShiftSwapsController::class, 'pendingCount']);
        Route::post('shift-swaps/{swapId}/review', [ShiftSwapsController::class, 'review']);
    });
    Route::prefix('')->middleware('employee')->group(function () {
        Route::post('wellness-entries', [WellnessEntriesController::class, 'storeEntry']);
        Route::get('employees/{id}/wellness-entries', [WellnessEntriesController::class, 'getByEmployee']);
        Route::get('employee/{id}/shifts', [ShiftsController::class, 'getEmployeeShifts']);
        Route::get('/fatigue-scores/{employeeId}', [FatigueScoreController::class, 'getEmployeeScore']);
        Route::get('employee-preferences', [EmployeePreferencesController::class, 'listPreferences']);
        Route::get('employees/{employeeId}/preferences', [EmployeePreferencesController::class, 'getPreference']);
        Route::post('employee-preferences', [EmployeePreferencesController::class, 'storePreference']);
        Route::delete('employees/{employeeId}/preferences', [EmployeePreferencesController::class, 'deletePreference']);
        Route::get('employees/{employeeId}/availability', [EmployeeAvailabilityController::class, 'getAvailability']);
        Route::post('employee-availability', [EmployeeAvailabilityController::class, 'storeAvailability']);
        Route::put('employee-availability/{id}', [EmployeeAvailabilityController::class, 'updateAvailability']);
        Route::delete('employee-availability/{id}', [EmployeeAvailabilityController::class, 'deleteAvailability']);
        Route::post('shift-swaps', [ShiftSwapsController::class, 'store']);
        Route::get('shift-swaps/{swapId}', [ShiftSwapsController::class, 'show']);
        Route::post('shift-swaps/{swapId}/cancel', [ShiftSwapsController::class, 'cancel']);
        Route::get('shifts/{shiftId}/swap-candidates', [ShiftSwapsController::class, 'eligibleCandidates']);
        Route::get('shifts/{shiftId}/swappable-shifts', [ShiftSwapsController::class, 'swappableShifts']);
    });
});
