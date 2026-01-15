<?php

namespace App\Services;

use App\Models\Shift_Templates;
use Illuminate\Support\Collection;

class ShiftTemplateService
{
    public function listTemplates(): Collection
    {
        return Shift_Templates::with(['positionRequirements.position'])
            ->select([
                'id',
                'name',
                'shift_type',
                'start_time',
                'end_time',
                'is_active',
            ])
            ->orderBy('name')
            ->get()
            ->map(function ($template) {
                $template->position_requirements = $template->positionRequirements->map(function ($req) {
                    return [
                        'position_id' => $req->position_id,
                        'required_count' => $req->required_count,
                    ];
                });
                unset($template->positionRequirements);

                return $template;
            });
    }

    public function createTemplate(array $data): Shift_Templates
    {
        return Shift_Templates::create($data);
    }
}
