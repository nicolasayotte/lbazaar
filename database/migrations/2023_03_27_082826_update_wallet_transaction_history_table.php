<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('wallet_transaction_histories', function (Blueprint $table) {
            $table->bigInteger('course_schedule_id')->nullable();
            $table->bigInteger('user_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('wallet_transaction_histories', function (Blueprint $table) {
            $table->dropColumn('course_schedule_id');
            $table->dropColumn('user_id');
        });
    }
};
