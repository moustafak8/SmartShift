<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewSwapRequest;
use App\Http\Requests\SwapRequest;
use App\Http\Requests\TargetRespondSwapRequest;
use App\Services\ShiftSwapService;
use Illuminate\Http\Request;

class ShiftSwapsController extends Controller
{
    public function __construct(
        private ShiftSwapService $swapService
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

        if (! $swap) {
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

        if (! $swap) {
            return $this->responseJSON(null, 'Cannot cancel this swap', 400);
        }

        return $this->responseJSON($swap, 'Swap cancelled', 200);
    }

    public function review(int $swapId, ReviewSwapRequest $request)
    {
        $swap = $this->swapService->reviewSwap(
            $swapId,
            auth()->id(),
            $request->input('decision'),
            $request->input('notes')
        );

        if (! $swap) {
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

    public function swappableShifts(int $shiftId)
    {
        $shifts = $this->swapService->getSwappableShiftsForDate($shiftId);

        return $this->responseJSON($shifts, 'success', 200);
    }

    public function targetRespond(int $swapId, TargetRespondSwapRequest $request)
    {
        $swap = $this->swapService->targetRespond(
            $swapId,
            auth()->id(),
            $request->input('response')
        );

        if (! $swap) {
            return $this->responseJSON(null, 'Cannot respond to this swap request', 400);
        }

        $message = $request->input('response') === 'accept'
            ? 'Swap request accepted'
            : 'Swap request declined';

        return $this->responseJSON($swap, $message, 200);
    }

    public function incomingSwaps()
    {
        $userId = auth()->id();
        $swaps = $this->swapService->getSwapsForTarget($userId);

        return $this->responseJSON($swaps, 'success', 200);
    }

    public function outgoingSwaps()
    {
        $userId = auth()->id();
        $swaps = $this->swapService->getOutgoingSwaps($userId);

        return $this->responseJSON($swaps, 'success', 200);
    }

    public function awaitingManager(Request $request)
    {
        $departmentId = $request->query('department_id');
        $swaps = $this->swapService->getSwapsAwaitingManager($departmentId ? (int) $departmentId : null);

        return $this->responseJSON($swaps, 'success', 200);
    }
}
