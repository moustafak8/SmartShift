<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeePreferenceRequest;
use App\Services\EmployeePrefrenceService;

class EmployeePreferencesController extends Controller
{
    protected EmployeePrefrenceService $prefrenceService;

    public function __construct(EmployeePrefrenceService $prefrenceService)
    {
        $this->prefrenceService = $prefrenceService;
    }

    public function listPreferences()
    {
        $data = $this->prefrenceService->listPreferences();

        return $this->responseJSON($data, 'success', 200);
    }

    public function getPreference($employeeId)
    {
        $data = $this->prefrenceService->getByEmployee((int) $employeeId);

        if (! $data) {
            return $this->responseJSON(null, 'No preference found', 404);
        }

        return $this->responseJSON($data, 'success', 200);
    }

    public function storePreference(StoreEmployeePreferenceRequest $request)
    {
        $preference = $this->prefrenceService->storePreference($request->validated());

        return $this->responseJSON($preference, 'Preference stored successfully', 201);
    }

    public function deletePreference($employeeId)
    {
        $deleted = $this->prefrenceService->deletePreference((int) $employeeId);

        if (! $deleted) {
            return $this->responseJSON(null, 'Preference not found', 404);
        }

        return $this->responseJSON(null, 'Preference deleted successfully', 200);
    }
}
