<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Students
        $this->createWithRoles(10);

        // Teachers
        $this->createWithRoles(5, Role::TEACHER);

        // Admin
        $this->createWithRoles(2, Role::ADMIN);
    }

    /**
     * Create users and attached roles
     * @param int $count The number of users to be created
     * @param string $role The role that will be attached
     */
    private function createWithRoles($count = 1, $role = Role::STUDENT)
    {
        $users = User::factory()->count($count);

        if ($role == Role::TEACHER) {
            $users = $users->classified()->temporaryPassword();
        }

        $users = $users->create();

        foreach ($users as $user) {
            $user->attachRole($role);
        }
    }
}
