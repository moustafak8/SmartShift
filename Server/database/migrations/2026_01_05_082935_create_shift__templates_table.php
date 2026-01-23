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
        Schema::create('shift__templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->enum('shift_type', ['day', 'evening', 'night', 'rotating']);
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('duration_hours', 4, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift__templates');
    }
};
