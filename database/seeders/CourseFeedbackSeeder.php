<?php

namespace Database\Seeders;

use App\Models\CourseFeedback;
use App\Models\CourseHistory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class CourseFeedbackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $completedCourses = CourseHistory::where('completed_at', '!=', NULL)->get();

        foreach ($completedCourses as $courseHistory) {
            CourseFeedback::factory()
                        ->state(new Sequence([
                            'course_id' => $courseHistory->course_id,
                            'user_id'   => $courseHistory->user_id,
                            'schedule_id' => $courseHistory->schedule_id
                        ]))
                        ->create();
        }
    }
}
