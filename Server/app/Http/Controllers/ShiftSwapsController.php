<?php

namespace App\Http\Controllers;

use App\Http\Requests\SwapRequest;
use App\Services\ShiftSwapService;
use Illuminate\Http\Request;

class ShiftSwapsController extends Controller
{
    public function __construct(
        protected ShiftSwapService $swapService
    ) {}

    public function index(Request $request)
    {
        $employeeId = $request->query('employee_id');
        $swaps = $this->swapService->listSwaps($employeeId ? (int) $employeeId : null);

        return $this->responseJSON($swaps, 'success', 200);
    }

    public function show(int $swapId)
    {
        $swap = $this->swapService->getSwap($swapId);

        if (!$swap) {
            return $this->responseJSON(null, 'Swap not found', 404);
        }

        return $this->responseJSON($swap, 'success', 200);
    }

    public function store(SwapRequest $request)
    {
        try {
            $userId = auth()->id();
            $swap = $this->swapService->createSwap($userId, $request->validated());

            return $this->responseJSON($swap, 'Swap request created and sent for validation', 201);
        } catch (\Exception $e) {
            return $this->responseJSON(null, $e->getMessage(), 400);
        }
    }

    public function cancel(int $swapId)
    {
        $userId = auth()->id();
        $swap = $this->swapService->cancelSwap($swapId, $userId);

        if (!$swap) {
            return $this->responseJSON(null, 'Cannot cancel this swap', 400);
        }

        return $this->responseJSON($swap, 'Swap cancelled', 200);
    }

    public function review(int $swapId, Request $request)
    {
        $request->validate([
            'decision' => ['required', 'in:approve,reject'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $reviewerId = auth()->id();
        $swap = $this->swapService->reviewSwap(
            $swapId,
            $reviewerId,
            $request->input('decision'),
            $request->input('notes')
        );

        if (!$swap) {
            return $this->responseJSON(null, 'Cannot review this swap', 400);
        }

        return $this->responseJSON($swap, 'Swap reviewed', 200);
    }

    public function pendingCount(Request $request)
    {
        $departmentId = $request->query('department_id');
        $count = $this->swapService->getPendingSwapsCount($departmentId ? (int) $departmentId : null);

        return $this->responseJSON(['count' => $count], 'success', 200);
    }

    public function eligibleCandidates(int $shiftId)
    {
        $userId = auth()->id();
        $candidates = $this->swapService->getEligibleSwapCandidates($shiftId, $userId);

        return $this->responseJSON($candidates, 'success', 200);
    }
}
