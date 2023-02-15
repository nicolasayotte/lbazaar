<?php

namespace Database\Seeders;

use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
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
        $coursesSchedules  = CourseSchedule::all();

        foreach ($coursesSchedules as $coursesSchedule) {
            $course = $coursesSchedule->course()->first();
            foreach ($students as $student) {
                CourseHistory::factory()
                            ->count(1)
                            ->state(new Sequence([
                                'user_id' => $student->id,
                                'course_id' => $course->id,
                                'course_schedule_id' => $coursesSchedule->id,
                                'completed_at' => fake()->randomElement([null, Carbon::now(), null])
                            ]))
                            ->create();
            }
        }
    }
}
