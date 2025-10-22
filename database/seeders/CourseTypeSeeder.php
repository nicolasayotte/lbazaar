<?php

namespace Database\Seeders;

use App\Models\CourseType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CourseTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $types = [
            CourseType::GENERAL,
            CourseType::FREE,
            CourseType::EARN,
            CourseType::SPECIAL
        ];

        foreach ($types as $type) {
            CourseType::updateOrCreate([
                'name' => $type,
                'type' => $type
            ]);
        }
    }
}
