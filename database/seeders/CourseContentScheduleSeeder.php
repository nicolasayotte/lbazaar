<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Factories\Sequence;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\CourseContentSchedule;
use Carbon\Carbon;
class CourseContentScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $courseSchedules = CourseSchedule::all();

        foreach ($courseSchedules as $courseSchedule) {
            $course = $courseSchedule->course()->first();
            $courseScheduleDate =Carbon::parse($courseSchedule->schedule_datetime)->format("Y-m-d H:i:s");
            $contents = $course->contents()->get();

            foreach($contents as $content) {
                CourseContentSchedule::factory()
                    ->count(1)
                        ->state(new Sequence([
                            'course_schedule_id' => $courseSchedule->id,
                            'course_content_id' => $content->id,
                            'schedule_datetime' => $courseScheduleDate,
                            'video_path' => $content->video_path,
                            'video_link' => $content->video_link,
                            'zoom_link' => $content->zoom_link,
                            'is_live' => $content->is_live,
                        ]))
                        ->create();
                        $courseScheduleDate = Carbon::parse($courseScheduleDate)->addDay()->format("Y-m-d H:i:s");
            }
        }
    }
}
