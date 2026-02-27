<?php

namespace Database\Seeders;

use App\Models\CourseType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
            CourseType::GENERAL_ID => CourseType::GENERAL,
            CourseType::FREE_ID    => CourseType::FREE,
            CourseType::EARN_ID    => CourseType::EARN,
            CourseType::SPECIAL_ID => CourseType::SPECIAL,
        ];

        // Remove stale rows not matching canonical IDs (e.g. from old auto-increment seeding
        // in persistent parallel test databases). Safe in production: only deletes orphaned rows.
        DB::table('course_types')->whereNotIn('id', array_keys($types))->delete();

        foreach ($types as $id => $name) {
            // Use query builder (not Eloquent) so the explicit $id is honoured on INSERT.
            // CourseType::$fillable does not include 'id', so Eloquent's updateOrCreate
            // would silently fall back to auto-increment when the row doesn't yet exist.
            DB::table('course_types')->updateOrInsert(
                ['id' => $id],
                ['name' => $name, 'type' => $name]
            );
        }
    }
}
