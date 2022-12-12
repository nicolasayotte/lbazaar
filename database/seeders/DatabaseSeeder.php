<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            ClassificationSeeder::class,
            StatusSeeder::class,
            CourseTypeSeeder::class,
            CourseCategorySeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,
            CourseApplicationSeeder::class,
            CourseSeeder::class,
            CourseContentSeeder::class,
            CourseHistorySeeder::class
        ]);
    }
}
