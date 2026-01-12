<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employee__departments', function (Blueprint $table) {
            $table->foreignId('position_id')->nullable()->after('department_id')->constrained('positions')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee__departments', function (Blueprint $table) {
            $table->dropForeignIdFor('positions');
            $table->dropColumn('position_id');
        });
    }
};
