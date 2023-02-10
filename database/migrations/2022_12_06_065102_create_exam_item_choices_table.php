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
        Schema::create('exam_item_choices', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('exam_item_id')->unsigned()->index()->nullable();
            $table->string('value');
            $table->integer('sort');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('exam_item_id')->references('id')->on('exam_items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('exam_item_choices');
    }
};
