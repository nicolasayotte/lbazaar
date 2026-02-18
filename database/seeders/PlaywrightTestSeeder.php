<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PlaywrightTestSeeder extends Seeder
{
    private const DEFAULT_PASSWORD = 'Test1234!';

    public function run(): void
    {
        DB::transaction(function () {
            $country = Country::firstOrCreate(
                ['code' => 'JPN'],
                ['name' => 'Japan']
            );

            Role::firstOrCreate(
                ['name' => 'student'],
                ['display_name' => 'Student', 'description' => 'Student role for Playwright fixtures']
            );

            Role::firstOrCreate(
                ['name' => 'teacher'],
                ['display_name' => 'Teacher', 'description' => 'Teacher role for Playwright fixtures']
            );

            Role::firstOrCreate(
                ['name' => 'admin'],
                ['display_name' => 'Admin', 'description' => 'Admin role for Playwright fixtures']
            );

            $student = $this->upsertUser(
                ['email' => 'pw-student@example.com'],
                [
                    'first_name' => 'Playwright',
                    'last_name' => 'Student',
                    'country_id' => $country->id,
                ]
            );

            if (! $student->hasRole('student')) {
                $student->attachRole('student');
            }

            $teacher = $this->upsertUser(
                ['email' => 'pw-teacher@example.com'],
                [
                    'first_name' => 'Playwright',
                    'last_name' => 'Teacher',
                    'country_id' => $country->id,
                ]
            );

            if (! $teacher->hasRole('teacher')) {
                $teacher->attachRole('teacher');
            }

            $admin = $this->upsertUser(
                ['email' => 'pw-admin@example.com'],
                [
                    'first_name' => 'Playwright',
                    'last_name' => 'Admin',
                    'country_id' => $country->id,
                ]
            );

            if (! $admin->hasRole('admin')) {
                $admin->attachRole('admin');
            }
        });
    }

    private function upsertUser(array $identifiers, array $attributes): User
    {
        $user = User::firstOrNew($identifiers);

        $fillAttributes = array_merge([
            'first_name' => data_get($attributes, 'first_name', $user->first_name),
            'last_name' => data_get($attributes, 'last_name', $user->last_name),
        ], $attributes);

        $user->forceFill(array_merge($fillAttributes, [
            'password' => Hash::make(self::DEFAULT_PASSWORD),
            'email_verified_at' => now(),
            'is_enabled' => true,
            'custodial_address' => 'addr_test1playwright_dummy_address',
        ]));
        $user->save();

        return $user->fresh();
    }
}
