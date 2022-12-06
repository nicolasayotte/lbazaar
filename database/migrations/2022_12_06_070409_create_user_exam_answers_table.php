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
        Schema::create('user_exam_answers', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_exam_id')->unsigned()->index()->nullable();
            $table->bigInteger('exam_item_id')->unsigned()->index()->nullable();
            $table->bigInteger('exam_item_choice_id')->unsigned()->index()->nullable();
            $table->boolean('is_correct');
            $table->timestamps();

            $table->foreign('user_exam_id')->references('id')->on('user_exams');
            $table->foreign('exam_item_id')->references('id')->on('exam_items');
            $table->foreign('exam_item_choice_id')->references('id')->on('exam_item_choices');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_exam_answers');
    }
};
