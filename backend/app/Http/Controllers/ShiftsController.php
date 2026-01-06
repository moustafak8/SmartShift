<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftRequest;
use App\Services\EmployeeShifts;
use App\Services\ShiftService;

class ShiftsController extends Controller
{
    protected EmployeeShifts $employeeShiftsService;
    protected ShiftService $shiftService;

    public function __construct(EmployeeShifts $employeeShiftsService, ShiftService $shiftService)
    {
        $this->employeeShiftsService = $employeeShiftsService;
        $this->shiftService = $shiftService;
    }

    public function getEmployeeShifts($id)
    {
        $data = $this->employeeShiftsService->getEmployeeShifts($id);

        return $this->responseJSON($data, 'success', 200);
    }
    
    public function index()
    {
        $data = $this->shiftService->listShifts();

        return $this->responseJSON($data, 'success', 200);
    }

    public function store(StoreShiftRequest $request)
    {
        $shift = $this->shiftService->createShift($request->validated());

        return $this->responseJSON($shift, 'success', 201);
    }
}
