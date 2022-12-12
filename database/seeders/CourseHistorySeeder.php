<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class CourseHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $students = User::whereRoleIs(Role::STUDENT)->get();
        $courses  = Course::all();

        foreach ($courses as $course) {
            foreach ($students as $student) {
                CourseHistory::factory()
                            ->state(new Sequence([
                                'user_id' => $student->id,
                                'course_id' => $course->id
                            ]))
                            ->create();
            }
        }
    }
}
