<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\UserCertification;
use App\Models\UserEducation;
use App\Models\UserWorkHistory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class TeacherInformationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $teacherUsers = User::whereRoleIs(Role::TEACHER)->get();

        foreach ($teacherUsers as $user) {
            // User education
            UserEducation::factory()
                        ->count(fake()->numberBetween(1, 3))
                        ->state(new Sequence([
                            'user_id' => $user->id
                        ]))
                        ->create();

            // User certifications
            UserCertification::factory()
                        ->count(fake()->numberBetween(1, 3))
                        ->state(new Sequence([
                            'user_id' => $user->id
                        ]))
                        ->create();

            // User work history
            UserWorkHistory::factory()
                        ->count(fake()->numberBetween(1, 3))
                        ->state(new Sequence([
                            'user_id' => $user->id
                        ]))
                        ->create();
        }
    }
}
