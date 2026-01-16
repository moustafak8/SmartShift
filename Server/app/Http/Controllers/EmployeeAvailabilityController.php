<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeAvailabilityRequest;
use App\Http\Requests\UpdateEmployeeAvailabilityRequest;
use App\Services\EmployeeAvailabilityService;
use Illuminate\Http\Request;

class EmployeeAvailabilityController extends Controller
{
    protected EmployeeAvailabilityService $availabilityService;

    public function __construct(EmployeeAvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    public function getAvailability($employeeId)
    {
        $data = $this->availabilityService->getByEmployee((int) $employeeId);

        return $this->responseJSON($data, 'success', 200);
    }

    public function getAvailableEmployeesForDate($departmentId, Request $request)
    {
        $date = $request->query('date');

        if (! $date) {
            return $this->responseJSON(null, 'Date parameter is required', 400);
        }

        $data = $this->availabilityService->getAvailableEmployeesForDate((int) $departmentId, $date);

        return $this->responseJSON($data, 'success', 200);
    }

    public function storeAvailability(StoreEmployeeAvailabilityRequest $request)
    {
        $availability = $this->availabilityService->storeAvailability($request->validated());

        return $this->responseJSON($availability, 'Availability stored successfully', 201);
    }

    public function updateAvailability($id, UpdateEmployeeAvailabilityRequest $request)
    {
        $availability = $this->availabilityService->updateAvailability((int) $id, $request->validated());

        return $this->responseJSON($availability, 'Availability updated successfully', 200);
    }

    public function deleteAvailability($id)
    {
        $deleted = $this->availabilityService->deleteAvailability((int) $id);

        if (! $deleted) {
            return $this->responseJSON(null, 'Availability not found', 404);
        }

        return $this->responseJSON(null, 'Availability deleted successfully', 200);
    }
}
