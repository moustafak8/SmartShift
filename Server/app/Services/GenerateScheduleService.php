<?php

namespace App\Services;

use App\Prompts\ScheduleAiPrompt;
use App\Models\Shift_Assigments;
use App\Models\Shifts;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use OpenAI\Laravel\Facades\OpenAI;

class GenerateScheduleService
{
    public function __construct(
        private EmployeeAvailabilityService $availabilityService,
        private EmployeePrefrenceService $preferenceService,
        private ScoreService $scoreService,
        private ShiftService $shiftService,
        private AssigmentsService $assignmentsService,
        private EmployeeWeeklyStatsCache $statsCache,
        private NotificationService $notificationService
    ) {}

    public function generateSchedule(int $departmentId, string $startDate, string $endDate): array
    {
        try {
            // Check if schedule already exists for this period
            $existingSchedule = $this->checkIfScheduleExists($departmentId, $startDate, $endDate);
            if ($existingSchedule['exists']) {
                return [
                    'success' => false,
                    'message' => 'Schedule already exists for this period',
                    'existing_assignments_count' => $existingSchedule['count'],
                    'existing_date_range' => $existingSchedule['date_range'],
                ];
            }

            $scheduleRequirements = $this->fetchScheduleRequirements($departmentId, $startDate, $endDate);
            $employeeData = $this->fetchEmployeeData($departmentId);
            $assignments = $this->assignEmployeesToShifts($scheduleRequirements, $employeeData);

            $enrichedAssignments = $this->enrichAssignmentsWithNames($assignments, $employeeData);
            $shiftDetails = $this->buildShiftDetails($scheduleRequirements, $assignments);

            return [
                'success' => true,
                'message' => 'Schedule generated successfully',
                'assignments_count' => count($assignments),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'department_id' => $departmentId,
                'assignments' => $enrichedAssignments,
                'shift_details' => $shiftDetails,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Schedule generation failed: ' . $e->getMessage(),
                'error' => $e,
            ];
        }
    }

    public function checkIfScheduleExists(int $departmentId, string $startDate, string $endDate): array
    {
        try {
            $start = Carbon::parse($startDate)->toDateString();
            $end = Carbon::parse($endDate)->toDateString();

            $existingAssignments = Shift_Assigments::with('shift')
                ->whereHas('shift', function ($query) use ($departmentId, $start, $end) {
                    $query->where('department_id', $departmentId)
                        ->whereBetween('shift_date', [$start, $end]);
                })
                ->count();

            if ($existingAssignments > 0) {
                $dateRgeInfo = Shift_Assigments::with('shift')
                    ->whereHas('shift', function ($query) use ($departmentId, $start, $end) {
                        $query->where('department_id', $departmentId)
                            ->whereBetween('shift_date', [$start, $end]);
                    })
                    ->get()
                    ->groupBy('shift.shift_date');

                return [
                    'exists' => true,
                    'count' => $existingAssignments,
                    'date_range' => [
                        'first_date' => $dateRgeInfo->keys()->first(),
                        'last_date' => $dateRgeInfo->keys()->last(),
                    ],
                ];
            }

            return [
                'exists' => false,
                'count' => 0,
                'date_range' => null,
            ];
        } catch (\Exception $e) {
            return [
                'exists' => false,
                'count' => 0,
                'date_range' => null,
            ];
        }
    }

    public function saveReviewedSchedule(array $assignments): array
    {
        DB::beginTransaction();
        try {
            if (empty($assignments)) {
                return [
                    'success' => false,
                    'message' => 'No assignments provided to save',
                ];
            }

            $normalized = array_map([$this, 'normalizeAssignmentPayload'], $assignments);
            $createdAssignments = $this->assignmentsService->createBulkAssignments($normalized);

            $assignmentIds = $createdAssignments->pluck('id')->toArray();
            $this->assignmentsService->updateAssignmentStatuses($assignmentIds);

            $shiftIds = array_unique(array_column($assignments, 'shift_id'));
            $this->shiftService->updateShiftStatusesByAssignments($shiftIds);

            DB::commit();

            $this->sendShiftAssignmentNotifications($createdAssignments);

            return [
                'success' => true,
                'message' => 'Schedule saved successfully',
                'assignments_count' => count($assignments),
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            return [
                'success' => false,
                'message' => 'Failed to save schedule: ' . $e->getMessage(),
                'error' => $e,
            ];
        }
    }

    private function sendShiftAssignmentNotifications(Collection $assignments): void
    {
        if ($assignments->isEmpty()) {
            return;
        }


        $shiftIds = $assignments->pluck('shift_id')->unique()->values();
        $shiftsById = Shifts::whereIn('id', $shiftIds)->get()->keyBy('id');


        $firstShiftDate = $shiftsById
            ->pluck('shift_date')
            ->filter()
            ->sort()
            ->first();

        $weekStart = $firstShiftDate ? Carbon::parse($firstShiftDate)->startOfWeek() : null;
        $weekEnd = $firstShiftDate ? Carbon::parse($firstShiftDate)->endOfWeek() : null;


        $assignmentsByEmployee = $assignments->groupBy('employee_id');

        foreach ($assignmentsByEmployee as $employeeId => $employeeAssignments) {
            $hasAnyShift = $employeeAssignments->contains(
                fn($a) => $shiftsById->has($a->shift_id)
            );
            if (! $hasAnyShift) {
                continue;
            }

            $title = 'Weekly Schedule Published';
            $range = ($weekStart && $weekEnd)
                ? $weekStart->format('M j') . ' - ' . $weekEnd->format('M j')
                : 'this week';

            $message = "Your weekly schedule for {$range} has been published.";

            $this->notificationService->send(
                (int) $employeeId,
                NotificationService::TYPE_SCHEDULE_PUBLISHED,
                $title,
                $message,
                'normal',
                'schedule',
                null
            );
        }
    }

    private function normalizeAssignmentPayload(array $assignment): array
    {

        $assignment['assignment_type'] = $this->assignmentsService->determineAssignmentType(
            $assignment['employee_id'],
            $assignment['shift_id'],
            $this->getShiftDateById($assignment['shift_id'])
        );

        $assignment['status'] = $this->assignmentsService->determineAssignmentStatus(
            $assignment['shift_id'],
            $this->getShiftDateById($assignment['shift_id'])
        );

        return $assignment;
    }

    private function getShiftDateById(int $shiftId): string
    {
        $shift = Shifts::find($shiftId);

        return $shift ? $shift->shift_date : Carbon::today()->toDateString();
    }

    private function fetchScheduleRequirements(int $departmentId, string $startDate, string $endDate): array
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        $shifts = Shifts::with('positionRequirements.position')
            ->where('department_id', $departmentId)
            ->whereBetween('shift_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('shift_date')
            ->orderBy('start_time')
            ->get();

        $requirements = [];

        foreach ($shifts as $shift) {
            $requirements[$shift->id] = [
                'shift' => $shift,
                'shift_id' => $shift->id,
                'shift_date' => $shift->shift_date,
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
                'shift_type' => $shift->shift_type,
                'department_id' => $shift->department_id,
                'position_requirements' => $this->formatPositionRequirements($shift->positionRequirements),
            ];
        }

        return $requirements;
    }

    private function formatPositionRequirements(Collection $requirements): array
    {
        $formatted = [];

        foreach ($requirements as $req) {
            $formatted[$req->position_id] = [
                'position_id' => $req->position_id,
                'position_name' => $req->position->name ?? 'Unknown',
                'required_count' => $req->required_count,
                'filled_count' => 0,
                'assigned_employees' => [],
            ];
        }

        return $formatted;
    }

    private function fetchEmployeeData(int $departmentId): array
    {
        $employees = User::with(['employeeDepartments.position'])
            ->whereHas('employeeDepartments', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->where('is_active', true)
            ->get();

        $employeeData = [];

        foreach ($employees as $employee) {
            $employeeData[$employee->id] = [
                'user' => $employee,
                'employee_id' => $employee->id,
                'full_name' => $employee->full_name,
                'positions' => $this->getEmployeePositions($employee),
                'availability' => null,
                'preferences' => $this->preferenceService->getByEmployee($employee->id),
                'fatigue_score' => $this->getFatigueScore($employee->id),
                'hours_assigned' => 0,
                'consecutive_days' => [],
            ];
        }

        return $employeeData;
    }

    private function getEmployeePositions(User $employee): array
    {
        return $employee->employeeDepartments()
            ->pluck('position_id')
            ->toArray();
    }

    private function getFatigueScore(int $employeeId): ?array
    {
        try {
            return $this->scoreService->getLatestScoreForEmployee($employeeId);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function assignEmployeesToShifts(array $scheduleRequirements, array $employeeData): array
    {
        $assignments = [];
        $filledCounts = [];
        $assignedInShift = [];

        $candidatePool = $this->buildCandidatePool($scheduleRequirements, $employeeData, $assignments, $assignedInShift);

        $aiSuggestions = $this->requestAiAssignments($scheduleRequirements, $candidatePool, $employeeData);

        $this->applyAiAssignments(
            $aiSuggestions,
            $scheduleRequirements,
            $employeeData,
            $assignments,
            $filledCounts,
            $assignedInShift,
            $candidatePool
        );

        $this->fillRemainingWithGreedy(
            $scheduleRequirements,
            $employeeData,
            $assignments,
            $filledCounts,
            $assignedInShift,
            $candidatePool
        );

        return $assignments;
    }

    private function buildCandidatePool(
        array $scheduleRequirements,
        array $employeeData,
        array $assignments,
        array $assignedInShift
    ): array {
        $pool = [];

        foreach ($scheduleRequirements as $shiftId => $requirement) {
            $shiftDate = $requirement['shift_date'];
            foreach ($requirement['position_requirements'] as $positionId => $posReq) {
                $pool[$shiftId][$positionId] = [
                    'position_name' => $posReq['position_name'],
                    'required_count' => $posReq['required_count'],
                    'candidates' => [],
                ];

                foreach ($employeeData as $employeeId => $empData) {
                    if (! in_array($positionId, $empData['positions'])) {
                        continue;
                    }

                    if ($this->canEmployeeWorkShift(
                        $employeeId,
                        $shiftDate,
                        $requirement,
                        $employeeData,
                        $assignments,
                        $assignedInShift,
                        false,
                        $scheduleRequirements
                    )) {
                        $pool[$shiftId][$positionId]['candidates'][] = $employeeId;
                    }
                }
            }
        }

        return $pool;
    }

    private function requestAiAssignments(
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

    private function applyAiAssignments(
        array $aiAssignments,
        array $scheduleRequirements,
        array &$employeeData,
        array &$assignments,
        array &$filledCounts,
        array &$assignedInShift,
        array $candidatePool
    ): void {
        foreach ($aiAssignments as $item) {
            $shiftId = $item['shift_id'] ?? null;
            $positionId = $item['position_id'] ?? null;
            $employeeId = $item['employee_id'] ?? null;

            if (! $shiftId || ! $positionId || ! $employeeId) {
                continue;
            }

            if (! isset($scheduleRequirements[$shiftId]['position_requirements'][$positionId])) {
                continue;
            }

            if (! in_array($employeeId, $candidatePool[$shiftId][$positionId]['candidates'] ?? [], true)) {
                continue;
            }

            $shiftData = $scheduleRequirements[$shiftId];

            if ($this->canEmployeeWorkShift(
                $employeeId,
                $shiftData['shift_date'],
                $shiftData,
                $employeeData,
                $assignments,
                $assignedInShift,
                false,
                $scheduleRequirements
            )) {

                $assignments[] = [
                    'shift_id' => $shiftId,
                    'employee_id' => $employeeId,
                    'position_id' => $positionId,
                    'assignment_type' => 'regular',
                    'status' => 'assigned',
                ];

                $this->markAssignment($shiftId, $positionId, $employeeId, $filledCounts, $assignedInShift);
                $this->updateEmployeeTracking($employeeId, $shiftData, $employeeData);
            }
        }
    }

    private function fillRemainingWithGreedy(
        array $scheduleRequirements,
        array &$employeeData,
        array &$assignments,
        array &$filledCounts,
        array &$assignedInShift,
        array $candidatePool
    ): void {
        foreach ($scheduleRequirements as $shiftId => $req) {
            $shiftDate = $req['shift_date'];
            foreach ($req['position_requirements'] as $positionId => $posReq) {
                $required = $posReq['required_count'];
                $already = $filledCounts[$shiftId][$positionId] ?? 0;
                $remaining = $required - $already;

                if ($remaining <= 0) {
                    continue;
                }

                $shiftData = $scheduleRequirements[$shiftId];
                $sortedCandidates = $this->sortCandidatesByFairness($candidatePool[$shiftId][$positionId]['candidates'] ?? [], $employeeData);

                foreach ($sortedCandidates as $employeeId) {
                    if ($remaining <= 0) {
                        break;
                    }

                    if ($this->canEmployeeWorkShift(
                        $employeeId,
                        $shiftDate,
                        $shiftData,
                        $employeeData,
                        $assignments,
                        $assignedInShift,
                        false,
                        $scheduleRequirements
                    )) {
                        $assignments[] = [
                            'shift_id' => $shiftId,
                            'employee_id' => $employeeId,
                            'position_id' => $positionId,
                            'assignment_type' => 'regular',
                            'status' => 'assigned',
                        ];

                        $this->markAssignment($shiftId, $positionId, $employeeId, $filledCounts, $assignedInShift);
                        $this->updateEmployeeTracking($employeeId, $shiftData, $employeeData);
                        $remaining--;
                    }
                }
            }
        }
    }

    private function sortCandidatesByFairness(array $candidates, array $employeeData): array
    {
        $scored = array_map(function ($employeeId) use ($employeeData) {
            $empData = $employeeData[$employeeId];
            $hours = $empData['hours_assigned'] ?? 0;
            return ['id' => $employeeId, 'score' => $hours];
        }, $candidates);

        usort($scored, fn($a, $b) => $a['score'] <=> $b['score']);

        return array_column($scored, 'id');
    }

    private function markAssignment(
        int $shiftId,
        int $positionId,
        int $employeeId,
        array &$filledCounts,
        array &$assignedInShift
    ): void {
        $filledCounts[$shiftId][$positionId] = ($filledCounts[$shiftId][$positionId] ?? 0) + 1;
        $assignedInShift[$shiftId][$employeeId] = true;
    }

    private function canEmployeeWorkShift(
        int $employeeId,
        string $shiftDate,
        array $shiftData,
        array $employeeData,
        array $pendingAssignments = [],
        array $assignedInShift = [],
        bool $strictMode = false,
        array $scheduleRequirements = []
    ): bool {
        return $this->checkHardConstraints($employeeId, $shiftDate, $shiftData, $employeeData, $pendingAssignments, $assignedInShift, $scheduleRequirements)
            && ($strictMode ? $this->checkSoftConstraints($employeeId, $shiftDate, $shiftData, $employeeData) : true);
    }

    private function checkHardConstraints(
        int $employeeId,
        string $shiftDate,
        array $shiftData,
        array $employeeData,
        array $pendingAssignments,
        array $assignedInShift,
        array $scheduleRequirements
    ): bool {
        if (isset($assignedInShift[$shiftData['shift_id']][$employeeId])) {
            return false;
        }

        $availability = $this->availabilityService->getAvailabilityForDate($employeeId, $shiftDate);
        if ($availability && ! $availability['is_available']) {
            return false;
        }

        return ! $this->employeeAlreadyAssignedOnDate($employeeId, $shiftDate, $pendingAssignments, $scheduleRequirements);
    }

    private function checkSoftConstraints(
        int $employeeId,
        string $shiftDate,
        array $shiftData,
        array $employeeData
    ): bool {
        $empData = $employeeData[$employeeId];
        if (! $empData['preferences']) {
            return true;
        }

        $prefs = $empData['preferences'];

        if ($prefs->preferred_shift_types && ! in_array($shiftData['shift_type'], $prefs->preferred_shift_types)) {
            return false;
        }

        if (! is_null($prefs->max_shifts_per_week)) {
            if ($this->getShiftsInWeek($employeeId, $shiftDate) >= (int) $prefs->max_shifts_per_week) {
                return false;
            }
        }

        if (! is_null($prefs->max_hours_per_week)) {
            $hoursThisWeek = $this->getHoursInWeek($employeeId, $shiftDate);
            $shiftHours = $this->shiftService->calculateShiftDuration($shiftData['start_time'], $shiftData['end_time']);
            if (($hoursThisWeek + $shiftHours) > (float) $prefs->max_hours_per_week) {
                return false;
            }
        }

        if (! is_null($prefs->max_consecutive_days)) {
            if ($this->countConsecutiveDays($employeeId, $shiftDate) >= (int) $prefs->max_consecutive_days) {
                return false;
            }
        }

        return true;
    }

    private function getShiftsInWeek(int $employeeId, string $date): int
    {
        return $this->statsCache->getShiftsInWeek($employeeId, $date);
    }

    private function getHoursInWeek(int $employeeId, string $date): float
    {
        return $this->statsCache->getHoursInWeek($employeeId, $date);
    }

    private function countConsecutiveDays(int $employeeId, string $date): int
    {
        return $this->statsCache->countConsecutiveDays($employeeId, $date);
    }

    private function employeeAlreadyAssignedOnDate(
        int $employeeId,
        string $date,
        array $pendingAssignments = [],
        array $scheduleRequirements = []
    ): bool {
        foreach ($pendingAssignments as $assignment) {
            if ($assignment['employee_id'] === $employeeId) {
                $shiftId = $assignment['shift_id'];
                if (isset($scheduleRequirements[$shiftId]) && $scheduleRequirements[$shiftId]['shift_date'] === $date) {
                    return true;
                }
            }
        }

        return Shift_Assigments::with('shift')
            ->where('employee_id', $employeeId)
            ->whereHas('shift', function ($q) use ($date) {
                $q->where('shift_date', $date);
            })
            ->exists();
    }

    private function updateEmployeeTracking(int $employeeId, array $shiftData, array &$employeeData): void
    {
        $shiftHours = $this->shiftService->calculateShiftDuration($shiftData['start_time'], $shiftData['end_time']);
        $employeeData[$employeeId]['hours_assigned'] += $shiftHours;
        $employeeData[$employeeId]['consecutive_days'][] = $shiftData['shift_date'];
    }

    private function persistAssignments(array $assignments): void
    {
        if (empty($assignments)) {
            return;
        }

        $this->assignmentsService->createBulkAssignments($assignments);
    }

    private function enrichAssignmentsWithNames(array $assignments, array $employeeData): array
    {
        return array_map(function ($assignment) use ($employeeData) {
            return [
                'shift_id' => $assignment['shift_id'],
                'employee_id' => $assignment['employee_id'],
                'employee_name' => $employeeData[$assignment['employee_id']]['full_name'] ?? 'Unknown',
                'position_id' => $assignment['position_id'],
                'assignment_type' => $assignment['assignment_type'],
                'status' => $assignment['status'],
            ];
        }, $assignments);
    }

    private function buildShiftDetails(array $scheduleRequirements, array $assignments): array
    {
        $shiftDetails = [];

        foreach ($scheduleRequirements as $shiftId => $requirement) {
            $positionDetails = [];
            $assignmentsByPosition = [];

            foreach ($assignments as $assignment) {
                if ($assignment['shift_id'] === $shiftId) {
                    $posId = $assignment['position_id'];
                    if (! isset($assignmentsByPosition[$posId])) {
                        $assignmentsByPosition[$posId] = 0;
                    }
                    $assignmentsByPosition[$posId]++;
                }
            }

            foreach ($requirement['position_requirements'] as $positionId => $posReq) {
                $positionDetails[] = [
                    'position_id' => $positionId,
                    'position_name' => $posReq['position_name'],
                    'required_count' => $posReq['required_count'],
                    'eligible_candidates' => count($posReq['assigned_employees'] ?? []),
                ];
            }

            $shiftDetails[] = [
                'shift_id' => $shiftId,
                'date' => $requirement['shift_date'],
                'start_time' => $requirement['start_time'],
                'end_time' => $requirement['end_time'],
                'shift_type' => $requirement['shift_type'],
                'positions' => $positionDetails,
            ];
        }

        return $shiftDetails;
    }
}
