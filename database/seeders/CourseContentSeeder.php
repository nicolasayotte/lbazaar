<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\CourseContent;
use App\Models\Status;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class CourseContentSeeder extends Seeder
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
            $application = CourseApplication::findOrFail($course->course_application_id);
            $courseContents = json_decode($application->course_content_data);
            foreach ($courseContents as $courseContent) {
                CourseContent::factory()
                        ->count(1)
                        ->state(new Sequence([
                            'course_id' => $course->id,
                            'title' => $courseContent->title,
                            'description' => $courseContent->description,
                            'video_path' => $courseContent->video_path,
                            'video_link' => $courseContent->video_link,
                            'zoom_link' => $courseContent->zoom_link,
                            'is_live' => $courseContent->is_live,
                        ]))
                        ->create();
            }
        }
    }
}
