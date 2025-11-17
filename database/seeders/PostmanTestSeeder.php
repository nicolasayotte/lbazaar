<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Country;
use App\Models\Role;
use App\Models\User;
use App\Models\UserWallet;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PostmanTestSeeder extends Seeder
{
    private const DEFAULT_PASSWORD = 'password123';

    public function run(): void
    {
        DB::transaction(function () {
            $country = Country::firstOrCreate(
                ['code' => 'JPN'],
                ['name' => 'Japan']
            );

            Role::firstOrCreate(
                ['name' => 'teacher'],
                ['display_name' => 'Teacher', 'description' => 'Teacher role for Postman fixtures']
            );

            Role::firstOrCreate(
                ['name' => 'student'],
                ['display_name' => 'Student', 'description' => 'Student role for Postman fixtures']
            );

            $teacher = $this->upsertUser(
                ['email' => 'postman-teacher@example.com'],
                [
                    'first_name' => 'Postman',
                    'last_name' => 'Teacher',
                    'country_id' => $country->id,
                ]
            );

            if (! $teacher->hasRole('teacher')) {
                $teacher->attachRole('teacher');
            }

            $otherTeacher = $this->upsertUser(
                ['email' => 'postman-other-teacher@example.com'],
                [
                    'first_name' => 'Postman',
                    'last_name' => 'OtherTeacher',
                    'country_id' => $country->id,
                ]
            );

            if (! $otherTeacher->hasRole('teacher')) {
                $otherTeacher->attachRole('teacher');
            }

            $student = $this->upsertUser(
                ['email' => 'postman-student@example.com'],
                [
                    'first_name' => 'Postman',
                    'last_name' => 'Student',
                    'country_id' => $country->id,
                ]
            );

            if (! $student->hasRole('student')) {
                $student->attachRole('student');
            }

            $studentNoLink = $this->upsertUser(
                ['email' => 'postman-student-custodial@example.com'],
                [
                    'first_name' => 'Postman',
                    'last_name' => 'Custodial',
                    'country_id' => $country->id,
                ]
            );

            if (! $studentNoLink->hasRole('student')) {
                $studentNoLink->attachRole('student');
            }

            UserWallet::updateOrCreate(
                ['user_id' => $student->id],
                [
                    'points' => 100,
                    'stake_key_hash' => 'addr_test1qpmocklinkedaddress',
                ]
            );

            UserWallet::updateOrCreate(
                ['user_id' => $studentNoLink->id],
                [
                    'points' => 50,
                    'stake_key_hash' => null,
                ]
            );

            $mintableCourse = Course::firstOrCreate(
                ['title' => 'Postman Mintable Course'],
                [
                    'description' => 'Course prepared by PostmanTestSeeder.',
                    'language' => 'en',
                    'image_thumbnail' => null,
                    'nft_id' => null,
                    'course_type_id' => null,
                    'video_path' => null,
                    'zoom_link' => null,
                    'is_live' => false,
                    'price' => 50,
                    'points_earned' => 10,
                    'professor_id' => $teacher->id,
                    'course_application_id' => null,
                    'max_participant' => 25,
                    'is_cancellable' => false,
                    'days_before_cancellation' => null,
                ]
            );

            $mintableSchedule = CourseSchedule::firstOrNew(['course_id' => $mintableCourse->id]);
            $mintableSchedule->start_datetime = Carbon::create(2024, 1, 1, 9, 0, 0, 'UTC');
            $mintableSchedule->end_datetime = Carbon::create(2024, 1, 1, 11, 0, 0, 'UTC');
            $mintableSchedule->user_id = $teacher->id;
            $mintableSchedule->max_participant = 25;
            $mintableSchedule->is_completed = true;
            $mintableSchedule->save();

            CourseHistory::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'course_id' => $mintableCourse->id,
                    'course_schedule_id' => $mintableSchedule->id,
                ],
                [
                    'completed_at' => Carbon::create(2024, 1, 5, 12, 0, 0, 'UTC'),
                    'is_cancelled' => false,
                    'is_watched' => true,
                ]
            );

            Course::firstOrCreate(
                ['title' => 'Postman Empty Course'],
                [
                    'description' => 'Course without completions for Postman tests.',
                    'language' => 'en',
                    'image_thumbnail' => null,
                    'nft_id' => null,
                    'course_type_id' => null,
                    'video_path' => null,
                    'zoom_link' => null,
                    'is_live' => false,
                    'price' => 25,
                    'points_earned' => 5,
                    'professor_id' => $teacher->id,
                    'course_application_id' => null,
                    'max_participant' => 15,
                    'is_cancellable' => false,
                    'days_before_cancellation' => null,
                ]
            );
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
        ]));
        $user->save();

        return $user->fresh();
    }
}
