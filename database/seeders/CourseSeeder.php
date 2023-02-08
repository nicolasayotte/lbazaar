<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\Status;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $applications = CourseApplication::where('approved_at', '!=', NULL)
                                        ->inRandomOrder()
                                        ->limit(10)
                                        ->get();

        $statuses  = Status::whereIn('name', ['draft', 'published', 'completed'])->get()->toArray();

        foreach ($applications as $application) {
            Course::factory()
                    ->count(1)
                    ->state(new Sequence([
                        'title'                 => $application->title,
                        'description'           => $application->description,
                        'professor_id'          => $application->professor_id,
                        'status_id'             => $statuses[array_rand($statuses)]["id"],
                        'course_type_id'        => $application->course_type_id,
                        'course_category_id'    => $application->course_category_id,
                        'course_application_id' => $application->id,
                        'price'                 => $application->price,
                        'language'              => $application->language,
                        'points_earned'         => $application->points_earned
                    ]))
                    ->create();
        }
    }
}
