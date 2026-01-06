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
        Schema::create('fatigue_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->onDelete('cascade');
            $table->date('score_date');
            $table->integer('quantitative_score')->default(0);
            $table->integer('qualitative_score')->default(0);
            $table->integer('psychological_score')->default(0);
            $table->integer('total_score')->storedAs(
                'quantitative_score + qualitative_score + psychological_score'
            );
            $table->string('risk_level', 20)->storedAs(
                'CASE 
        WHEN total_score <= 30 THEN "low"
        WHEN total_score <= 60 THEN "medium"
        ELSE "high"
    END'
            );
            $table->timestamps();
            $table->unique(['employee_id', 'score_date']);
            $table->index('risk_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fatigue_scores');
    }
};
