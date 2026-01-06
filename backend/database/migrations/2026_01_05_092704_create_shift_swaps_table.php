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
        Schema::create('shift_swaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('requester_shift_id')->constrained('shifts')->onDelete('cascade');
            $table->foreignId('target_employee_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('target_shift_id')->nullable()->constrained('shifts')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled', 'completed'])
                ->default('pending');
            $table->text('swap_reason')->nullable();
            // AI validation results
            $table->boolean('validation_passed')->nullable();
            $table->json('validation_notes')->nullable();
            $table->integer('requester_new_fatigue_score')->nullable();
            $table->integer('target_new_fatigue_score')->nullable();
            // Review (if needed)
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
            $table->index('requester_id');
            $table->index('target_employee_id');
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_swaps');
    }
};
