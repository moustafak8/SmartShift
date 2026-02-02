<?php

namespace App\Services;

use App\Prompts\ScheduleAiPrompt;
use Carbon\Carbon;
use OpenAI\Laravel\Facades\OpenAI;

class ScheduleAiAssignmentService
{
    public function requestAiAssignments(
        array $scheduleRequirements,
        array $candidatePool,
        array $employeeData
    ): array {
        try {
            $prompt = $this->buildAiPrompt($scheduleRequirements, $candidatePool, $employeeData);
            $raw = $this->callOpenAi($prompt);

            return $this->parseAiAssignments($raw);
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function buildAiPrompt(array $scheduleRequirements, array $candidatePool, array $employeeData): string
    {
        $shiftBlocks = [];
        foreach ($scheduleRequirements as $shiftId => $req) {
            $positions = [];
            foreach ($candidatePool[$shiftId] ?? [] as $posId => $pos) {
                $candidateNames = array_map(function ($empId) use ($employeeData) {
                    $empData = $employeeData[$empId];
                    $fatigueLevel = $empData['fatigue_score']['risk_level'] ?? 'unknown';

                    return [
                        'id' => $empId,
                        'name' => $empData['full_name'] ?? 'Employee ' . $empId,
                        'fatigue_level' => $fatigueLevel,
                        'hours_this_schedule' => $empData['hours_assigned'] ?? 0,
                    ];
                }, $pos['candidates']);

                $positions[] = [
                    'position_id' => $posId,
                    'position_name' => $pos['position_name'],
                    'required_count' => $pos['required_count'],
                    'candidates' => $candidateNames,
                ];
            }

            $date = Carbon::parse($req['shift_date']);
            $isWeekend = $date->isWeekend();
            $shiftBlocks[] = [
                'shift_id' => $shiftId,
                'date' => (string) $req['shift_date'],
                'day_of_week' => $date->format('l'),
                'is_weekend' => $isWeekend,
                'start_time' => $req['start_time'],
                'end_time' => $req['end_time'],
                'shift_type' => $req['shift_type'],
                'positions' => $positions,
            ];
        }

        $instructions = ScheduleAiPrompt::getInstructions();

        return json_encode([
            'instructions' => $instructions,
            'shifts' => $shiftBlocks,
        ], JSON_PRETTY_PRINT);
    }

    private function callOpenAi(string $prompt): string
    {
        $response = OpenAI::chat()->create([
            'model' => config('openai.schedule.model'),
            'messages' => [
                ['role' => 'system', 'content' => ScheduleAiPrompt::getSystemPrompt()],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => config('openai.schedule.temperature'),
            'max_tokens' => config('openai.schedule.max_tokens'),
        ]);

        return $response->choices[0]->message->content ?? '';
    }

    private function parseAiAssignments(string $raw): array
    {
        $decoded = json_decode($raw, true);
        if (! is_array($decoded) || ! isset($decoded['assignments']) || ! is_array($decoded['assignments'])) {
            throw new \RuntimeException('AI response was not valid JSON assignments.');
        }

        return $decoded['assignments'];
    }
}
