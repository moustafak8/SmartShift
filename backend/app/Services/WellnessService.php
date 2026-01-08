<?php

namespace App\Services;

use App\Jobs\ProcessWellnessEntry;
use App\Models\WellnessEntries;
use Illuminate\Support\Collection;

class WellnessService
{
    public function listEntries(): Collection
    {
        return WellnessEntries::select([
            'id',
            'employee_id',
            'entry_text',
            'word_count',
            'created_at',
        ])->orderByDesc('created_at')->get();
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
