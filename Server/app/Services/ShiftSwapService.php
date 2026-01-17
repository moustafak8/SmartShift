<?php

namespace App\Services;

use App\Jobs\ValidateShiftSwap;
use App\Models\ShiftSwaps;
use Illuminate\Support\Collection;

class ShiftSwapService
{
    public function listSwaps(?int $employeeId = null): Collection
    {
        $query = ShiftSwaps::with([
            'requester:id,full_name',
            'targetEmployee:id,full_name',
            'requesterShift:id,shift_date,shift_type',
            'targetShift:id,shift_date,shift_type',
        ])->orderByDesc('created_at');

        if ($employeeId) {
            $query->where(function ($q) use ($employeeId) {
                $q->where('requester_id', $employeeId)
                  ->orWhere('target_employee_id', $employeeId);
            });
        }

        return $query->get();
    }

    public function getSwap(int $swapId): ?ShiftSwaps
    {
        return ShiftSwaps::with([
            'requester:id,full_name,email',
            'targetEmployee:id,full_name,email',
            'requesterShift:id,shift_date,shift_type,department_id',
            'targetShift:id,shift_date,shift_type,department_id',
            'reviewer:id,full_name',
        ])->find($swapId);
    }

    public function createSwap(int $requesterId, array $data): ShiftSwaps
    {
        $swap = ShiftSwaps::create([
            'requester_id' => $requesterId,
            'requester_shift_id' => $data['requester_shift_id'],
            'target_employee_id' => $data['target_employee_id'],
            'target_shift_id' => $data['target_shift_id'],
            'swap_reason' => $data['swap_reason'] ?? null,
            'status' => 'pending',
        ]);

        ValidateShiftSwap::dispatch($swap->id);

        return $swap->load([
            'requester:id,full_name',
            'targetEmployee:id,full_name',
            'requesterShift:id,shift_date,shift_type',
            'targetShift:id,shift_date,shift_type',
        ]);
    }

    public function cancelSwap(int $swapId, int $userId): ?ShiftSwaps
    {
        $swap = ShiftSwaps::find($swapId);

        if (!$swap) {
            return null;
        }

        if ($swap->requester_id !== $userId) {
            return null;
        }

        if (!in_array($swap->status, ['pending'])) {
            return null;
        }

        $swap->update(['status' => 'cancelled']);

        return $swap->fresh();
    }

    public function reviewSwap(int $swapId, int $reviewerId, string $decision, ?string $notes = null): ?ShiftSwaps
    {
        $swap = ShiftSwaps::find($swapId);

        if (!$swap || $swap->status !== 'pending') {
            return null;
        }

        $status = $decision === 'approve' ? 'approved' : 'rejected';

        $swap->update([
            'status' => $status,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);

        return $swap->fresh();
    }

    public function getPendingSwapsCount(?int $departmentId = null): int
    {
        $query = ShiftSwaps::where('status', 'pending');

        if ($departmentId) {
            $query->whereHas('requesterShift', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        return $query->count();
    }
}
