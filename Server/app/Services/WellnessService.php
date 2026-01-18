<?php

namespace App\Services;

use App\Jobs\ProcessWellnessEntry;
use App\Models\Employee_Department;
use App\Models\WellnessEntries;
use Illuminate\Support\Collection;

class WellnessService
{
    public function listEntries($departmentId): Collection
    {
        $employeeIds = Employee_Department::where('department_id', $departmentId)
            ->pluck('employee_id');

        return WellnessEntries::query()
            ->with(['employee', 'vector'])
            ->whereIn('employee_id', $employeeIds)
            ->whereDate('created_at', now()->toDateString())
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'employee_id' => $entry->employee_id,
                    'employee_name' => $entry->employee->full_name ?? null,
                    'entry_text' => $entry->entry_text,
                    'word_count' => $entry->word_count,
                    'created_at' => $entry->created_at,
                    'is_flagged' => $entry->vector->is_flagged ?? false,
                    'flag_severity' => $entry->vector->flag_severity ?? null,
                    'flag_reason' => $entry->vector->flag_reason ?? null,
                    'sentiment_label' => $entry->vector->sentiment_label ?? null,
                    'sentiment_score' => $entry->vector->sentiment_score ?? null,
                ];
            });
    }

    public function listByEmployee(int $employeeId): Collection
    {
        return WellnessEntries::where('employee_id', $employeeId)
            ->whereBetween('created_at', [
                now()->subDays(6)->startOfDay(),
                now()->endOfDay(),
            ])
            ->select(['id', 'employee_id', 'entry_text', 'word_count', 'created_at'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function createEntry(array $data): WellnessEntries
    {
        $data['word_count'] = str_word_count($data['entry_text']);
        $entry = WellnessEntries::create($data);
        ProcessWellnessEntry::dispatch($entry->id);

        return $entry;
    }
}
