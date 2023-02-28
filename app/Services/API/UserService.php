<?php

namespace App\Services\API;
use App\Models\User;
use App\Models\Role;
use App\Models\UserWallet;

class UserService
{
    public function createTeacher($user)
    {
        $teacher = User::create($user);
        $teacher->attachRole(ROLE::TEACHER);
        $teacher->update([
            'is_temp_password'  => true,
            'is_enabled'        => true,
        ]);

        UserWallet::create([
            'user_id' => $teacher->id,
            'points' => 0,
        ]);

        return $teacher;
    }

}
