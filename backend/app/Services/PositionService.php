<?php

namespace App\Services;

use App\Models\Position;
use Illuminate\Support\Collection;

class PositionService
{
    public function getPositionsByDepartment(int $departmentId): Collection
    {
        return Position::where('department_id', $departmentId)
            ->select([
                'id',
                'name',
                'description',
                'is_active',
            ])
            ->orderBy('name')
            ->get();
    }

    public function getAllPositions(): Collection
    {
        return Position::select([
            'id',
            'department_id',
            'name',
            'description',
            'is_active',
        ])
            ->with('department:id,name')
            ->orderBy('name')
            ->get();
    }

    public function getPositionById(int $positionId): ?Position
    {
        return Position::select([
            'id',
            'department_id',
            'name',
        ])
            ->with('department:id,name')
            ->find($positionId);
    }

    public function createPosition(array $data): Position
    {
        return Position::create([
            'department_id' => $data['department_id'],
            'name' => $data['name'],
        ]);
    }

    public function updatePosition(int $positionId, array $data): bool
    {
        $position = Position::find($positionId);
        if (! $position) {
            return false;
        }

        return $position->update([
            'name' => $data['name'] ?? $position->name,
            'description' => $data['description'] ?? $position->description,
        ]);
    }

    public function deletePosition(int $positionId): bool
    {
        return Position::destroy($positionId) > 0;
    }
}
