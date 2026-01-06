<?php

namespace App\Http\Controllers;

use App\Models\Shifts;
use App\Services\EmployeeShifts;

class ShiftsController extends Controller
{
    protected EmployeeShifts $employeeShiftsService;

    public function __construct(EmployeeShifts $employeeShiftsService)
    {
        $this->employeeShiftsService = $employeeShiftsService;
    }
    public function getEmployeeShifts($id)
    {
        try {
            $data = $this->employeeShiftsService->getEmployeeShifts($id);

            return $this->responseJSON(
                $data,
                'success',
                200
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->responseJSON(
                [],
                'error',
                404
            );
        }
    }
}
