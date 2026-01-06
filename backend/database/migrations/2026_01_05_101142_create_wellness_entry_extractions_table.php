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
        Schema::create('wellness_entry_extractions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('wellness_entries')->onDelete('cascade');
            $table->decimal('shift_duration_hours', 4, 2)->nullable();
            $table->enum('shift_type', ['day', 'evening', 'night', 'rotating'])->nullable();
            $table->decimal('sleep_hours_before', 3, 1)->nullable();
            $table->tinyInteger('sleep_quality_rating')->nullable();
            $table->integer('meals_count')->nullable();
            $table->enum('meal_quality', ['poor', 'adequate', 'good'])->nullable();
            $table->enum('stress_level', ['low', 'medium', 'high', 'severe'])->nullable();
            $table->tinyInteger('mood_rating')->nullable();
            $table->json('physical_symptoms')->nullable();
            $table->json('concerns_mentioned')->nullable();
            $table->decimal('parsing_confidence', 3, 2)->nullable();
            $table->timestamps();
            $table->unique('entry_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wellness_entry_extractions');
    }
};
