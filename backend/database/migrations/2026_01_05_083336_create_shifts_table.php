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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->foreignId('shift_template_id')->nullable()->constrained('shift__templates')->onDelete('set null');
            $table->date('shift_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('shift_type', ['day', 'evening', 'night', 'rotating']);
            $table->integer('required_staff_count')->default(1);
            $table->text('notes')->nullable();
            $table->enum('status', ['open', 'filled', 'understaffed', 'cancelled'])
                ->default('open');
            $table->timestamps();
            $table->index('shift_date');
            $table->index('status');
            $table->index(['department_id', 'shift_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
