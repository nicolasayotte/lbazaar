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
        Schema::table('user_badges', function (Blueprint $table) {
            $table->bigInteger('course_history_id')->unsigned()->index()->nullable();
            $table->bigInteger('course_package_id')->unsigned()->index()->nullable()->after('course_history_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('user_badges', function (Blueprint $table) {
            $table->dropColumn('course_history_id')->unsigned()->index()->nullable()->after('type');
            $table->dropColumn('course_package_id')->unsigned()->index()->nullable()->after('course_history_id');
        });
    }
};
