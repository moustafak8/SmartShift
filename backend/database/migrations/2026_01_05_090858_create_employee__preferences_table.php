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
        Schema::create('employee__preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->onDelete('cascade');
            $table->json('preferred_shift_types')->nullable();
            $table->integer('max_shifts_per_week')->default(5);
            $table->integer('max_hours_per_week')->default(40);
            $table->integer('max_consecutive_days')->default(5);
            $table->boolean('prefers_weekends')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee__preferences');
    }
};
