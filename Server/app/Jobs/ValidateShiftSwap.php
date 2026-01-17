<?php

namespace App\Jobs;

use App\Models\ShiftSwaps;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ValidateShiftSwap implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [10, 30, 60];

    public function __construct(
        public int $swapId
    ) {}

    public function handle(): void
    {
        $swap = $this->getShiftSwap();

        if (!$swap) {
            return;
        }

        try {
            $response = $this->callAgent($swap);
            $this->updateSwapWithResults($swap, $response);

            Log::info("Successfully validated shift swap {$this->swapId}");
        } catch (\Exception $e) {
            Log::error("Failed to validate shift swap {$this->swapId}: {$e->getMessage()}");
            throw $e;
        }
    }

    private function getShiftSwap(): ?ShiftSwaps
    {
        $swap = ShiftSwaps::find($this->swapId);

        if (!$swap) {
            Log::warning("Shift swap {$this->swapId} not found for validation");
        }

        return $swap;
    }

    private function callAgent(ShiftSwaps $swap): array
    {
        $agentUrl = config('services.ai_agent.url');
        $timeout = config('services.ai_agent.timeout', 30);

        $response = Http::timeout($timeout)
            ->post("{$agentUrl}/api/validate-swap", [
                'swap_id' => $swap->id,
                'requester_id' => $swap->requester_id,
                'requester_shift_id' => $swap->requester_shift_id,
                'target_employee_id' => $swap->target_employee_id,
                'target_shift_id' => $swap->target_shift_id,
                'swap_reason' => $swap->swap_reason,
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException("Agent returned error: {$response->status()} - {$response->body()}");
        }

        return $response->json();
    }

    private function updateSwapWithResults(ShiftSwaps $swap, array $response): void
    {
        $swap->update([
            'validation_passed' => $response['validation_passed'] ?? null,
            'validation_notes' => json_encode([
                'decision' => $response['decision'] ?? 'unknown',
                'confidence' => $response['confidence'] ?? 0,
                'reasoning' => $response['reasoning'] ?? null,
                'checks' => $response['checks'] ?? [],
                'risk_factors' => $response['risk_factors'] ?? [],
                'suggestions' => $response['suggestions'] ?? [],
                'processing_time_ms' => $response['processing_time_ms'] ?? null,
            ]),
            'requester_new_fatigue_score' => $this->extractFatigueScore($response, 'requester'),
            'target_new_fatigue_score' => $this->extractFatigueScore($response, 'target'),
            'status' => $this->determineNewStatus($response),
        ]);
    }

    private function extractFatigueScore(array $response, string $type): ?int
    {
        $checks = $response['checks'] ?? [];
        
        foreach ($checks as $check) {
            if (($check['check_name'] ?? '') === 'fatigue') {
                $details = $check['details'] ?? [];
                return $details["{$type}_after_swap"] ?? null;
            }
        }
        
        return null;
    }

    private function determineNewStatus(array $response): string
    {
        $decision = $response['decision'] ?? 'requires_review';
        
        return match ($decision) {
            'auto_approve' => 'approved',
            'auto_reject' => 'rejected',
            default => 'pending',
        };
    }
}
