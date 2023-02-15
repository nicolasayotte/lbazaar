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
        Schema::create('course_content_schedules', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('course_content_id')->unsigned()->index()->nullable();
            $table->bigInteger('course_schedule_id')->unsigned()->index()->nullable();
            $table->dateTime('start_datetime')->nullable();
            $table->string('video_path')->nullable();
            $table->string('video_link')->nullable();
            $table->string('zoom_link')->nullable();
            $table->boolean('is_live');

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('course_content_id')->references('id')->on('course_contents');
            $table->foreign('course_schedule_id')->references('id')->on('course_schedules');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_content_schedules');
    }
};
