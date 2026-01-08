<?php

namespace App\Services;

use App\Jobs\ProcessWellnessEntry;
use App\Models\WellnessEntries;
use Illuminate\Support\Collection;

class WellnessService
{
    public function listEntries($departmentId): Collection
    {
        return WellnessEntries::query()
            ->join('employee__departments as ed', 'ed.employee_id', '=', 'wellness_entries.employee_id')
            ->leftJoin('wellness_entry_vectors as v', 'v.entry_id', '=', 'wellness_entries.id')
            ->where('ed.department_id', $departmentId)
            ->whereDate('wellness_entries.created_at', now()->toDateString())
            ->select([
                'wellness_entries.id',
                'wellness_entries.employee_id',
                'wellness_entries.entry_text',
                'wellness_entries.word_count',
                'wellness_entries.created_at',
                'v.is_flagged',
                'v.flag_severity',
                'v.flag_reason',
                'v.sentiment_label',
                'v.sentiment_score',
            ])
            ->orderByDesc('wellness_entries.created_at')
            ->get();
    }

    public function listByEmployee(int $employeeId): Collection
    {
        return WellnessEntries::where('employee_id', $employeeId)
            ->select(['id', 'employee_id', 'entry_text', 'word_count', 'created_at'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function createEntry(array $data): WellnessEntries
    {
        $data['word_count'] = str_word_count($data['entry_text']);
        $entry = WellnessEntries::create($data);

        // Dispatch background job to process entry with OpenAI
        ProcessWellnessEntry::dispatch($entry->id);

        return $entry;
    }
}
