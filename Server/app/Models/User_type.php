<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User_type extends Model
{
    /** @use HasFactory<\Database\Factories\UserTypeFactory> */
    use HasFactory;

    protected $fillable = ['id', 'role_name'];
}
