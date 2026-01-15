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
        Schema::create('employee__availabilities', function (Blueprint $table) {
            $table->id('id');
            $table->foreignId('employee_id')->constrained('users')->onDelete('cascade');
            $table->unsignedTinyInteger('day_of_week')->nullable(); // 0=Sun, 6=Sat
            $table->date('specific_date')->nullable();
            $table->boolean('is_available')->default(true);
            $table->enum('preferred_shift_type', ['day', 'evening', 'night', 'any'])->nullable();
            $table->enum('reason', ['vacation', 'sick', 'personal', 'appointment', 'other'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['employee_id', 'day_of_week']);
            $table->index(['employee_id', 'specific_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee__availabilities');
    }
};
