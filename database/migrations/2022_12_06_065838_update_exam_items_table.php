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
        Schema::table('exam_items', function (Blueprint $table) {
            $table->bigInteger('correct_choice_id')->unsigned()->index()->nullable()->after('sort');
            $table->foreign('correct_choice_id')->references('id')->on('exam_item_choices');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('exam_items', function (Blueprint $table) {
            $table->dropForeign(['correct_choice_id']);
            $table->dropColumn('correct_choice_id');
        });
    }
};
