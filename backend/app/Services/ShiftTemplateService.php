<?php

namespace App\Services;

use App\Models\Shift_Templates;
use Illuminate\Support\Collection;

class ShiftTemplateService
{
    public function listTemplates(): Collection
    {
        return Shift_Templates::select([
            'id',
            'name',
            'shift_type',
            'start_time',
            'end_time',
            'is_active',
        ])->orderBy('name')->get();
    }

    public function createTemplate(array $data): Shift_Templates
    {
        return Shift_Templates::create($data);
    }
}
