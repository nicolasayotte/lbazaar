<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_histories', function (Blueprint $table) {
            $table->timestamp('rewards_notification_sent_at')->nullable()->after('rewards_invalidated_at');
        });
    }
    public function down(): void
    {
        Schema::table('course_histories', function (Blueprint $table) {
            $table->dropColumn('rewards_notification_sent_at');
        });
    }
};
