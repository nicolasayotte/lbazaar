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
        Schema::create('user_work_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('company');
            $table->string('position');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->longText('description');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_work_histories');
    }
};
