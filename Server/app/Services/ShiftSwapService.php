<?php

namespace App\Services;

use App\Jobs\ValidateShiftSwap;
use App\Models\Department;
use App\Models\Employee_Department;
use App\Models\Shift_Assigments;
use App\Models\Shifts;
use App\Models\ShiftSwaps;
use Illuminate\Support\Collection;

class ShiftSwapService
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

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

        $swap->load([
            'requester:id,full_name',
            'targetEmployee:id,full_name',
            'requesterShift:id,shift_date,shift_type',
            'targetShift:id,shift_date,shift_type',
        ]);

        $this->notificationService->send(
            $data['target_employee_id'],
            NotificationService::TYPE_SWAP_REQUEST,
            'New Shift Swap Request',
            "{$swap->requester->full_name} has requested to swap shifts with you.",
            'high',
            'shift_swap',
            $swap->id
        );

        return $swap;
    }

    public function cancelSwap(int $swapId, int $userId): ?ShiftSwaps
    {
        $swap = ShiftSwaps::with('requester:id,full_name')->find($swapId);

        if (! $swap) {
            return null;
        }

        if ($swap->requester_id !== $userId) {
            return null;
        }

        if (! in_array($swap->status, ['pending'])) {
            return null;
        }

        $swap->update(['status' => 'cancelled']);

        $this->notificationService->send(
            $swap->target_employee_id,
            NotificationService::TYPE_SWAP_CANCELLED,
            'Shift Swap Cancelled',
            "{$swap->requester->full_name} has cancelled their swap request.",
            'low',
            'shift_swap',
            $swap->id
        );

        return $swap->fresh();
    }

    public function reviewSwap(int $swapId, int $reviewerId, string $decision, ?string $notes = null): ?ShiftSwaps
    {
        $swap = ShiftSwaps::with('requester:id,full_name')->find($swapId);

        if (! $swap || $swap->status !== 'awaiting_manager') {
            return null;
        }

        if ($decision === 'approve') {
            $swap->update([
                'status' => 'awaiting_target',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'review_notes' => $notes,
            ]);

            $this->notificationService->send(
                $swap->target_employee_id,
                NotificationService::TYPE_SWAP_AWAITING,
                'Shift Swap Awaiting Your Response',
                "{$swap->requester->full_name}'s swap request has been approved. Please accept or decline.",
                'high',
                'shift_swap',
                $swap->id
            );
        } else {
            $swap->update([
                'status' => 'rejected',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'review_notes' => $notes,
            ]);

            $message = 'Your shift swap request has been rejected.';
            if ($notes) {
                $message .= " Reason: {$notes}";
            }

            $this->notificationService->send(
                $swap->requester_id,
                NotificationService::TYPE_SWAP_REJECTED,
                'Shift Swap Rejected',
                $message,
                'normal',
                'shift_swap',
                $swap->id
            );
        }

        return $swap->fresh();
    }

    public function targetRespond(int $swapId, int $targetUserId, string $response): ?ShiftSwaps
    {
        $swap = ShiftSwaps::with([
            'targetEmployee:id,full_name',
            'requester:id,full_name',
            'requesterShift:id,department_id',
        ])->find($swapId);

        if (! $swap || $swap->status !== 'awaiting_target') {
            return null;
        }

        if ($swap->target_employee_id !== $targetUserId) {
            return null;
        }

        if ($response === 'accept') {
            $this->executeSwap($swap);

            $swap->update([
                'status' => 'approved',
                'target_responded_at' => now(),
            ]);

            $this->notificationService->send(
                $swap->requester_id,
                NotificationService::TYPE_SWAP_APPROVED,
                'Shift Swap Approved',
                'Your shift swap request has been approved!',
                'normal',
                'shift_swap',
                $swap->id
            );
            $departmentId = $swap->requesterShift?->department_id;
            if ($departmentId) {
                $managerId = Department::where('id', $departmentId)->value('manager_id');
                if ($managerId) {
                    $this->notificationService->send(
                        (int) $managerId,
                        NotificationService::TYPE_SWAP_APPROVED,
                        'Shift Swap Completed',
                        "{$swap->requester->full_name} and {$swap->targetEmployee->full_name} completed a shift swap.",
                        'normal',
                        'shift_swap',
                        $swap->id
                    );
                }
            }
        } else {
            $swap->update([
                'status' => 'rejected',
                'target_responded_at' => now(),
            ]);

            $this->notificationService->send(
                $swap->requester_id,
                NotificationService::TYPE_SWAP_REJECTED,
                'Shift Swap Declined',
                "{$swap->targetEmployee->full_name} has declined your swap request.",
                'normal',
                'shift_swap',
                $swap->id
            );
        }

        return $swap->fresh();
    }

    private function executeSwap(ShiftSwaps $swap): void
    {
        $requesterAssignment = Shift_Assigments::where('shift_id', $swap->requester_shift_id)
            ->where('employee_id', $swap->requester_id)
            ->first();

        $targetAssignment = Shift_Assigments::where('shift_id', $swap->target_shift_id)
            ->where('employee_id', $swap->target_employee_id)
            ->first();

        if ($requesterAssignment && $targetAssignment) {
            $requesterAssignment->update([
                'shift_id' => $swap->target_shift_id,
                'assignment_type' => 'swap',
            ]);

            $targetAssignment->update([
                'shift_id' => $swap->requester_shift_id,
                'assignment_type' => 'swap',
            ]);
        }
    }

    public function getSwapsForTarget(int $targetEmployeeId): Collection
    {
        return ShiftSwaps::with([
            'requester:id,full_name',
            'requesterShift:id,shift_date,shift_type',
            'targetShift:id,shift_date,shift_type',
        ])
            ->where('target_employee_id', $targetEmployeeId)
            ->where('status', 'awaiting_target')
            ->orderByDesc('created_at')
            ->get();
    }

    public function getOutgoingSwaps(int $requesterId): Collection
    {
        return ShiftSwaps::with([
            'targetEmployee:id,full_name',
            'requesterShift:id,shift_date,shift_type',
            'targetShift:id,shift_date,shift_type',
        ])
            ->where('requester_id', $requesterId)
            ->whereIn('status', ['pending', 'awaiting_target', 'awaiting_manager', 'approved_by_target'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function getSwapsAwaitingManager(?int $departmentId = null): Collection
    {
        $query = ShiftSwaps::with([
            'requester:id,full_name',
            'targetEmployee:id,full_name',
            'requesterShift:id,shift_date,shift_type',
            'targetShift:id,shift_date,shift_type',
        ])->where('status', 'awaiting_manager');

        if ($departmentId) {
            $query->whereHas('requesterShift', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function getPendingSwapsCount(?int $departmentId = null): int
    {
        $query = ShiftSwaps::where('status', 'awaiting_manager');

        if ($departmentId) {
            $query->whereHas('requesterShift', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        return $query->count();
    }

    public function getSwappableShiftsForDate(int $assignmentId): Collection
    {
        $assignment = Shift_Assigments::find($assignmentId);

        if (! $assignment) {
            return collect([]);
        }

        $requesterShift = Shifts::find($assignment->shift_id);

        if (! $requesterShift) {
            return collect([]);
        }

        return Shifts::where('shift_date', $requesterShift->shift_date)
            ->where('id', '!=', $requesterShift->id)
            ->where('department_id', $requesterShift->department_id)
            ->whereIn('status', ['open', 'understaffed', 'filled'])
            ->select(['id', 'shift_date', 'shift_type', 'start_time', 'end_time', 'department_id'])
            ->get()
            ->map(fn($shift) => [
                'shift_id' => $shift->id,
                'shift_date' => $shift->shift_date,
                'shift_type' => $shift->shift_type,
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
            ]);
    }

    public function getEligibleSwapCandidates(int $shiftId, int $requesterId): Collection
    {
        $requesterPosition = Employee_Department::where('employee_id', $requesterId)
            ->where('is_primary', true)
            ->value('position_id');

        if (! $requesterPosition) {
            return collect([]);
        }

        $eligibleEmployeeIds = Employee_Department::where('position_id', $requesterPosition)
            ->where('employee_id', '!=', $requesterId)
            ->pluck('employee_id');

        return Shift_Assigments::where('shift_id', $shiftId)
            ->whereIn('employee_id', $eligibleEmployeeIds)
            ->whereIn('status', ['assigned', 'confirmed'])
            ->with(['employee:id,full_name,email', 'shift:id,shift_date,shift_type'])
            ->get()
            ->map(fn($assignment) => [
                'employee_id' => $assignment->employee_id,
                'full_name' => $assignment->employee?->full_name,
                'email' => $assignment->employee?->email,
                'assignment_id' => $assignment->id,
                'shift_id' => $assignment->shift_id,
                'shift_date' => $assignment->shift?->shift_date,
                'shift_type' => $assignment->shift?->shift_type,
            ]);
    }
}
