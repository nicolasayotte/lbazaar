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
        Schema::table('course_applications', function (Blueprint $table) {
            $table->dropColumn(['video_path', 'video_link', 'zoom_link', 'language']);
            $table->string('lecture_frequency')->nullable();
            $table->string('length')->nullable();
            $table->longText('data')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('course_applications', function (Blueprint $table) {
            $table->string('video_path')->nullable();
            $table->string('video_link')->nullable();
            $table->string('zoom_link')->nullable();
            $table->string('language')->nullable();
        });
    }
};
