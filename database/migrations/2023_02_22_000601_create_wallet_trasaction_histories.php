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
        Schema::create('wallet_transaction_histories', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_wallet_id');
            $table->bigInteger('course_history_id')->nullable();
            $table->string('type'); //enum feed, exchange, book, refund, earn
            $table->integer('points_before');
            $table->integer('points_after');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('wallet_transaction_histories');
    }
};
