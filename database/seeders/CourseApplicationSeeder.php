<?php

namespace Database\Seeders;

use App\Models\CourseApplication;
use App\Models\CourseType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class CourseApplicationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $teachers = User::whereRoleIs(Role::TEACHER)->get();

        foreach ($teachers as $teacher) {
            // General Classes
            $this->createData(fake()->numberBetween(1,5), $teacher->id);

            // Free Classes
            $this->createData(fake()->numberBetween(1,5), $teacher->id, CourseType::FREE);

            // Earn Classes
            $this->createData(fake()->numberBetween(1, 5), $teacher->id, CourseType::EARN);
        }
    }

    /**
     * Create course application data
     * @param int $count The number of rows to be created
     * @param int $userId The user that created this application
     * @param string $courseTypeName The name of the course type
     * @param bool $approved Set as approved when true, otherwise denied
     */
    private function createData($count = 1, $userId, $courseTypeName = CourseType::GENERAL)
    {
        $applications = CourseApplication::factory()
                                        ->count($count)
                                        ->state(new Sequence([
                                            'professor_id' => $userId
                                        ]));

        if ($courseTypeName == CourseType::FREE) {
            $applications = $applications->free();
        }
        if ($courseTypeName == CourseType::EARN) {
            $applications = $applications->earn();
        }
        if ($courseTypeName == CourseType::SPECIAL) {
            $applications = $applications->special();
        }

        $applications = $applications->approved();

        $createdApplications = $applications->create();

        foreach ($createdApplications as $application) {
            $categoryIds = \App\Models\CourseCategory::inRandomOrder()->limit(rand(1, 3))->pluck('id');
            $application->categories()->attach($categoryIds);
        }

        return $createdApplications;
    }
}
