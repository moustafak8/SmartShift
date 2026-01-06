<?php

namespace App\Http\Controllers;

use App\Services\EmployeeDepartmentService;

class EmployeeDepartmentController extends Controller
{
    protected EmployeeDepartmentService $employeeDepartmentService;

    public function __construct(EmployeeDepartmentService $employeeDepartmentService)
    {
        $this->employeeDepartmentService = $employeeDepartmentService;
    }

    public function getemployees($id)
    {
        $employees = $this->employeeDepartmentService->getEmployeeDepartments($id);

        return $this->responseJSON($employees, 'success', 200);
    }
}
