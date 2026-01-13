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
        Schema::table('shift__position_requirements', function (Blueprint $table) {
            $table->foreignId('shift_template_id')
                ->nullable()
                ->after('id')
                ->constrained('shift__templates')
                ->onDelete('cascade');
            
            $table->foreignId('shift_id')->nullable()->change();
            $table->index('shift_template_id');
            $table->dropUnique(['shift_id', 'position_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shift__position_requirements', function (Blueprint $table) {
            $table->dropForeign(['shift_template_id']);
            $table->dropIndex(['shift_template_id']);
            $table->dropColumn('shift_template_id');
            $table->foreignId('shift_id')->nullable(false)->change();
            $table->unique(['shift_id', 'position_id']);
        });
    }
};
