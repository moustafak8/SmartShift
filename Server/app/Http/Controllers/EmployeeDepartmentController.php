<?php

namespace App\Http\Controllers;

use App\Services\EmployeeDepartmentService;

class EmployeeDepartmentController extends Controller
{
    public function __construct(
        private EmployeeDepartmentService $employeeDepartmentService
    ) {}

    public function getemployees($id)
    {
        $employees = $this->employeeDepartmentService->getEmployeeDepartments($id);

        return $this->responseJSON($employees, 'success', 200);
    }
}
