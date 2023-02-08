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
        Schema::create('course_applications', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('professor_id')->unsigned()->index()->nullable();
            $table->string('course_type')->nullable();
            $table->string('course_category')->nullable();
            $table->string('title');
            $table->longtext('description');
            $table->double('price')->nullable();
            $table->string('language')->nullable();
            $table->double('points_earned')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('denied_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('professor_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_applications');
    }
};
