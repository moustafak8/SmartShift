<?php

namespace App\Services;

use App\Models\Shift_Assigments;
use App\Models\Shifts;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class GenerateScheduleService
{
    private const OPENAI_CHAT_MODEL = 'gpt-4o';

    private const OPENAI_TEMPERATURE = 0.3;

    private const OPENAI_MAX_TOKENS = 1200;

    private const FATIGUE_HIGH_THRESHOLD = 70;

    private const FATIGUE_MEDIUM_THRESHOLD = 40;

    private const FATIGUE_DEFAULT_SCORE = 50;

    private const FATIGUE_SCORE_WEIGHT = 0.1;

    private const DEFAULT_MAX_SHIFTS_PER_WEEK = 5;

    private const DEFAULT_MAX_HOURS_PER_WEEK = 40;

    private const DEFAULT_MAX_CONSECUTIVE_DAYS = 5;

    private EmployeeAvailabilityService $availabilityService;

    private EmployeePrefrenceService $preferenceService;

    private ScoreService $scoreService;

    private ShiftService $shiftService;

    private AssigmentsService $assignmentsService;

    private EmployeeWeeklyStatsCache $statsCache;

    private NotificationService $notificationService;

    public function __construct(
        EmployeeAvailabilityService $availabilityService,
        EmployeePrefrenceService $preferenceService,
        ScoreService $scoreService,
        ShiftService $shiftService,
        AssigmentsService $assignmentsService,
        EmployeeWeeklyStatsCache $statsCache,
        NotificationService $notificationService
    ) {
        $this->availabilityService = $availabilityService;
        $this->preferenceService = $preferenceService;
        $this->scoreService = $scoreService;
        $this->shiftService = $shiftService;
        $this->assignmentsService = $assignmentsService;
        $this->statsCache = $statsCache;
        $this->notificationService = $notificationService;
    }

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
                'message' => 'Schedule generation failed: '.$e->getMessage(),
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
            Log::error('Error checking existing schedule', [
                'department_id' => $departmentId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'error' => $e->getMessage(),
            ]);

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
            Log::error('Failed to save reviewed schedule', [
                'error' => $e->getMessage(),
                'assignments_count' => count($assignments),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to save schedule: '.$e->getMessage(),
                'error' => $e,
            ];
        }
    }

    private function sendShiftAssignmentNotifications(Collection $assignments): void
    {
        $shiftsCache = [];

        foreach ($assignments as $assignment) {
            $employeeId = $assignment->employee_id;
            $shiftId = $assignment->shift_id;

            // Cache shift data to avoid multiple queries
            if (! isset($shiftsCache[$shiftId])) {
                $shiftsCache[$shiftId] = Shifts::find($shiftId);
            }

            $shift = $shiftsCache[$shiftId];
            if (! $shift) {
                continue;
            }

            $shiftDate = Carbon::parse($shift->shift_date);
            $startTime = Carbon::parse($shift->start_time)->format('g:ia');
            $endTime = Carbon::parse($shift->end_time)->format('g:ia');
            $dayName = $shiftDate->format('l');
            $formattedDate = $shiftDate->format('M j');

            $this->notificationService->send(
                $employeeId,
                NotificationService::TYPE_SHIFT_ASSIGNED,
                'New Shift Scheduled',
                "You're scheduled for {$dayName}, {$formattedDate}: {$startTime}-{$endTime} {$shift->shift_type} Shift",
                'normal',
                'shift',
                $shiftId
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
                'availability' => null, // Will be fetched per-shift
                'preferences' => $this->preferenceService->getByEmployee($employee->id),
                'fatigue_score' => $this->getFatigueScore($employee->id),
                'hours_assigned' => 0, // Track hours for this schedule
                'consecutive_days' => [], // Track consecutive working days
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
            Log::warning('AI scheduling failed, falling back to greedy', ['error' => $e->getMessage()]);

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
                    $fatigueLevel = 'unknown';
                    if ($empData['fatigue_score']) {
                        $score = $empData['fatigue_score']['fatigue_score'] ?? 0;
                        $fatigueLevel = $score > self::FATIGUE_HIGH_THRESHOLD ? 'high' : ($score > self::FATIGUE_MEDIUM_THRESHOLD ? 'medium' : 'low');
                    }

                    return [
                        'id' => $empId,
                        'name' => $empData['full_name'] ?? 'Employee '.$empId,
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

            // Determine if this is a peak shift (weekend or specific hours)
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

        $instructions = 'You are an intelligent shift scheduling assistant for a restaurant business. '
            .'Your task: Assign employees to positions for each shift based on the provided eligible candidates. '
            .'CRITICAL RULES: '
            .'1. Each position has a required_count - you MUST  fill ALL slots with different employees. '
            .'2. An employee can work MULTIPLE different shifts throughout the week if they appear in multiple candidate lists. '
            .'3. An employee can only be assigned to ONE position per shift (no duplicate assignments within the same shift_id). '
            .'4. FAIR DISTRIBUTION - Distribute hours fairly across employees. Check hours_this_schedule for each candidate. '
            .'5. FATIGUE AWARENESS - Avoid assigning high-fatigue employees to consecutive shifts. Prioritize low/medium fatigue when possible. '
            .'6. WEEKEND BALANCE - Distribute weekend shifts fairly. Don\'t give all weekends to the same employees. '
            .'7. EXPERIENCE - For peak shifts (weekends, busy times), try to have a good mix if possible. '
            .'8. All candidates provided have already been validated for availability and position qualifications. '
            .'Output: Return ONLY valid JSON with an "assignments" array containing objects: {"shift_id": number, "position_id": number, "employee_id": number}.';

        return json_encode([
            'instructions' => $instructions,
            'shifts' => $shiftBlocks,
        ], JSON_PRETTY_PRINT);
    }

    private function callOpenAi(string $prompt): string
    {
        $response = OpenAI::chat()->create([
            'model' => self::OPENAI_CHAT_MODEL,
            'messages' => [
                ['role' => 'system', 'content' => 'You return pure JSON only.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => self::OPENAI_TEMPERATURE,
            'max_tokens' => self::OPENAI_MAX_TOKENS,
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
                continue; // invalid position or shift
            }

            if (! in_array($employeeId, $candidatePool[$shiftId][$positionId]['candidates'] ?? [], true)) {
                continue; // not an eligible candidate
            }

            $shiftData = $scheduleRequirements[$shiftId];

            // Check constraint before assigning
            if ($this->canEmployeeWorkShift(
                $employeeId,
                $shiftData['shift_date'],
                $shiftData,  // Pass full shift data, not position requirements
                $employeeData,
                $assignments,
                $assignedInShift,
                false,  // lenient mode
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

                if ($remaining > 0) {
                    Log::warning(
                        "Understaffed position {$posReq['position_name']} shift {$shiftId}",
                        ['required' => $required, 'assigned' => $required - $remaining]
                    );
                }
            }
        }
    }

    private function sortCandidatesByFairness(array $candidates, array $employeeData): array
    {
        $scored = array_map(function ($employeeId) use ($employeeData) {
            $empData = $employeeData[$employeeId];
            $hours = $empData['hours_assigned'] ?? 0;
            $fatigue = $empData['fatigue_score']['fatigue_score'] ?? self::FATIGUE_DEFAULT_SCORE;

            return ['id' => $employeeId, 'score' => $hours + ($fatigue * self::FATIGUE_SCORE_WEIGHT)];
        }, $candidates);

        usort($scored, fn ($a, $b) => $a['score'] <=> $b['score']);

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

        $maxShiftsPerWeek = $prefs->max_shifts_per_week ?? self::DEFAULT_MAX_SHIFTS_PER_WEEK;
        if ($this->getShiftsInWeek($employeeId, $shiftDate) >= $maxShiftsPerWeek) {
            return false;
        }

        $maxHoursPerWeek = $prefs->max_hours_per_week ?? self::DEFAULT_MAX_HOURS_PER_WEEK;
        $hoursThisWeek = $this->getHoursInWeek($employeeId, $shiftDate);
        $shiftHours = $this->shiftService->calculateShiftDuration($shiftData['start_time'], $shiftData['end_time']);
        if (($hoursThisWeek + $shiftHours) > $maxHoursPerWeek) {
            return false;
        }

        $maxConsecutiveDays = $prefs->max_consecutive_days ?? self::DEFAULT_MAX_CONSECUTIVE_DAYS;
        if ($this->countConsecutiveDays($employeeId, $shiftDate) >= $maxConsecutiveDays) {
            return false;
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
            Log::warning('No assignments to persist');

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
