<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift_Position_Requirement extends Model
{
    use HasFactory;

    protected $table = 'shift__position_requirements';

    protected $fillable = [
        'shift_id',
        'shift_template_id',
        'position_id',
        'required_count',
        'filled_count',
    ];

    public function shift()
    {
        return $this->belongsTo(Shifts::class, 'shift_id');
    }

    public function template()
    {
        return $this->belongsTo(Shift_Templates::class, 'shift_template_id');
    }

    public function position()
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

}
