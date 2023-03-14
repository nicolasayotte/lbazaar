<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\CourseSchedule;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('course_schedules', function (Blueprint $table) {
            $table->bigInteger('user_id')->unsigned()->index()->nullable()->after('course_id');
        });
        $courseSchedules = CourseSchedule::all();
        foreach($courseSchedules as $courseSchedule)
        {
            $courseSchedule->update(['user_id' => $courseSchedule->course()->first()->professor_id]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('course_schedules', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }
};
