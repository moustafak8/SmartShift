<?php

namespace Database\Seeders;

use App\Models\User_type;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run()
    {
        User_type::updateOrCreate(['id' => 1], ['role_name' => 'Admin']);
        User_type::updateOrCreate(['id' => 2], ['role_name' => 'Manager']);
        User_type::updateOrCreate(['id' => 3], ['role_name' => 'Employee']);
    }
}
