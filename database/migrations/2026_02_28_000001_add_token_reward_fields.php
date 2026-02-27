<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('course_applications', function (Blueprint $table) {
            $table->boolean('token_reward_enabled')->default(false)->after('certificate_enabled');
            $table->unsignedInteger('token_reward_amount')->nullable()->after('token_reward_enabled');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('token_reward_enabled')->default(false)->after('certificate_enabled');
            $table->unsignedInteger('token_reward_amount')->nullable()->after('token_reward_enabled');
        });

        Schema::table('course_histories', function (Blueprint $table) {
            $table->enum('token_reward_status', ['eligible', 'minting', 'minted', 'failed'])
                ->nullable()
                ->after('certificate_minted_at');
            $table->string('token_reward_tx_hash', 64)->nullable()->after('token_reward_status');
            $table->timestamp('token_reward_minted_at')->nullable()->after('token_reward_tx_hash');
        });
    }

    public function down()
    {
        Schema::table('course_applications', function (Blueprint $table) {
            $table->dropColumn(['token_reward_enabled', 'token_reward_amount']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['token_reward_enabled', 'token_reward_amount']);
        });

        Schema::table('course_histories', function (Blueprint $table) {
            $table->dropColumn(['token_reward_status', 'token_reward_tx_hash', 'token_reward_minted_at']);
        });
    }
};
