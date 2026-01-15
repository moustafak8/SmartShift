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
        Schema::create('wellness_entry_vectors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('wellness_entries')->onDelete('cascade');
            $table->string('qdrant_point_id')->nullable();
            $table->decimal('sentiment_score', 3, 2)->nullable();
            $table->enum('sentiment_label', ['positive', 'neutral', 'negative'])->nullable();
            $table->json('detected_keywords')->nullable();
            $table->boolean('is_flagged')->default(false);
            $table->text('flag_reason')->nullable();
            $table->enum('flag_severity', ['medium', 'high', 'critical'])->nullable();
            $table->timestamps();
            $table->unique('entry_id');
            $table->index('qdrant_point_id');
            $table->index(['is_flagged', 'flag_severity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wellness_entry_vectors');
    }
};
