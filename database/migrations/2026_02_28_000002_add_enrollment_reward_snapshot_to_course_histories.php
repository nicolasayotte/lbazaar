<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_histories', function (Blueprint $table) {
            $table->boolean('enrolled_certificate_enabled')->nullable()->after('rewards_invalidated_at');
            $table->string('enrolled_certificate_name')->nullable()->after('enrolled_certificate_enabled');
            $table->text('enrolled_certificate_description')->nullable()->after('enrolled_certificate_name');
            $table->boolean('enrolled_token_reward_enabled')->nullable()->after('enrolled_certificate_description');
            $table->unsignedInteger('enrolled_token_reward_amount')->nullable()->after('enrolled_token_reward_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('course_histories', function (Blueprint $table) {
            $table->dropColumn([
                'enrolled_certificate_enabled',
                'enrolled_certificate_name',
                'enrolled_certificate_description',
                'enrolled_token_reward_enabled',
                'enrolled_token_reward_amount',
            ]);
        });
    }
};
