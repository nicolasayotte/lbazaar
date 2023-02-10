<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Factories\Sequence;
use App\Models\Course;
use App\Models\CourseSchedule;

class CourseScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $courses = Course::all();

        foreach ($courses as $course) {
            CourseSchedule::factory()
                        ->count(1)
                        ->state(new Sequence([
                            'course_id' => $course->id
                        ]))
                        ->create();
        }
    }
}
