<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\UserCertification;
use App\Models\UserEducation;
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
            // User Education
            UserEducation::factory()
                        ->count(fake()->numberBetween(1, 3))
                        ->state(new Sequence([
                            'user_id' => $user->id
                        ]))
                        ->create();

            // User Certifications
            UserCertification::factory()
                        ->count(fake()->numberBetween(1, 3))
                        ->state(new Sequence([
                            'user_id' => $user->id
                        ]))
                        ->create();
        }
    }
}
