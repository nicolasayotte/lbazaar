<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN payment_status ENUM('pending', 'confirmed', 'failed', 'refunded') NULL"
        );
        Schema::table('course_histories', function (Blueprint $table) {
            $table->timestamp('rewards_invalidated_at')->nullable()->after('payment_confirmed_at');
        });
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN payment_status ENUM('pending', 'confirmed', 'failed') NULL"
        );
        Schema::table('course_histories', function (Blueprint $table) {
            $table->dropColumn('rewards_invalidated_at');
        });
    }
};
