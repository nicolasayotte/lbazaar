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
        Schema::create('course_contents', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('course_id')->unsigned()->index()->nullable();
            $table->string('title');
            $table->longtext('description');
            $table->string('video_path')->nullable();
            $table->string('zoom_link')->nullable();
            $table->integer('sort');
            $table->boolean('is_live');
            $table->integer('max_participant');
            $table->dateTime('schedule_datetime');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('course_id')->references('id')->on('courses');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_contents');
    }
};
