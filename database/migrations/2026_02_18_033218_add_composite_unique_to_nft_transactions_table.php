<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add composite unique constraint to ensure one certificate per student per course schedule.
     * This enforces data integrity for the certificateTransaction() relationship.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('nft_transactions', function (Blueprint $table) {
            // Add composite unique constraint: one NFT transaction per user per course schedule
            $table->unique(['user_id', 'course_id', 'schedule_id'], 'nft_transactions_user_course_schedule_unique');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('nft_transactions', function (Blueprint $table) {
            $table->dropUnique('nft_transactions_user_course_schedule_unique');
        });
    }
};
