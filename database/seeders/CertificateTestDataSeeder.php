<?php

namespace Database\Seeders;

use App\Models\Classifications;
use App\Models\Country;
use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\CourseCategory;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\CourseType;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds deterministic users and course data for manual certificate testing.
 *
 * Teacher: davis.hector@example.org  (password: Test1234!)
 *   → owns "Introduction to Cardano Blockchain" with certificates + token rewards enabled
 *   → has 3 completed students eligible for airdrop
 *
 * Student: ldouglas@example.org  (password: Test1234!)
 *   → completed the course, can self-mint a certificate
 *
 * Extra students (mjohnson@example.com, akiyama.yuki@example.org) also completed
 * so the teacher can test single and batch airdrop.
 */
class CertificateTestDataSeeder extends Seeder
{
    private const DEFAULT_PASSWORD = 'Test1234!';

    public function run(): void
    {
        DB::transaction(function () {
            // ── Reference data ──────────────────────────────────────
            $country = Country::firstOrCreate(
                ['code' => 'JPN'],
                ['name' => 'Japan']
            );

            $generalType = CourseType::firstOrCreate(
                ['name' => CourseType::GENERAL],
                ['type' => 'general']
            );

            $category = CourseCategory::firstOrCreate(
                ['name' => 'Blockchain']
            );

            $publishedStatus = Status::firstOrCreate(
                ['name' => Status::PUBLISHED]
            );

            $classification = Classifications::firstOrCreate(
                ['name' => 'Professor'],
                ['commision_rate' => 70]
            );

            // ── Teacher: davis.hector@example.org ────────────────────
            $teacher = $this->upsertUser(
                ['email' => 'davis.hector@example.org'],
                [
                    'first_name'        => 'Hector',
                    'last_name'         => 'Davis',
                    'country_id'        => $country->id,
                    'classification_id' => $classification->id,
                    'commission_rate'   => 70,
                ]
            );

            if (! $teacher->hasRole('teacher')) {
                $teacher->attachRole('teacher');
            }

            UserWallet::firstOrCreate(
                ['user_id' => $teacher->id],
                ['badges' => 0, 'credit' => 0]
            );

            // ── Student: ldouglas@example.com ────────────────────────
            $student1 = $this->upsertUser(
                ['email' => 'ldouglas@example.org'],
                [
                    'first_name' => 'Laura',
                    'last_name'  => 'Douglas',
                    'country_id' => $country->id,
                ]
            );

            if (! $student1->hasRole('student')) {
                $student1->attachRole('student');
            }

            UserWallet::firstOrCreate(
                ['user_id' => $student1->id],
                ['badges' => 0, 'credit' => 0]
            );

            // ── Extra student: mjohnson@example.com ──────────────────
            $student2 = $this->upsertUser(
                ['email' => 'mjohnson@example.com'],
                [
                    'first_name' => 'Marcus',
                    'last_name'  => 'Johnson',
                    'country_id' => $country->id,
                ]
            );

            if (! $student2->hasRole('student')) {
                $student2->attachRole('student');
            }

            UserWallet::firstOrCreate(
                ['user_id' => $student2->id],
                ['badges' => 0, 'credit' => 0]
            );

            // ── Extra student: akiyama.yuki@example.org ──────────────
            $student3 = $this->upsertUser(
                ['email' => 'akiyama.yuki@example.org'],
                [
                    'first_name' => 'Yuki',
                    'last_name'  => 'Akiyama',
                    'country_id' => $country->id,
                ]
            );

            if (! $student3->hasRole('student')) {
                $student3->attachRole('student');
            }

            UserWallet::firstOrCreate(
                ['user_id' => $student3->id],
                ['badges' => 0, 'credit' => 0]
            );

            // ── Course Application (approved) ────────────────────────
            $application = CourseApplication::firstOrCreate(
                ['professor_id' => $teacher->id, 'title' => 'Introduction to Cardano Blockchain'],
                [
                    'course_type_id'   => $generalType->id,
                    'description'      => 'Learn the fundamentals of the Cardano blockchain ecosystem, smart contracts, and native tokens.',
                    'price'            => 8,

                    'max_participant'  => 50,
                    'is_live'          => false,
                    'approved_at'      => now(),
                    'length'           => '02:00:00',
                    'lecture_frequency' => 'weekly',
                ]
            );
            $application->categories()->syncWithoutDetaching([$category->id]);

            // ── Course (certificates + token rewards enabled) ────────
            $course = Course::firstOrCreate(
                ['course_application_id' => $application->id],
                [
                    'title'                    => $application->title,
                    'description'              => $application->description,
                    'professor_id'             => $teacher->id,
                    'status_id'                => $publishedStatus->id,
                    'course_type_id'           => $generalType->id,
                    'price'                    => $application->price,
                    'points_earned'            => 0,
                    'max_participant'          => $application->max_participant,
                    'is_live'                  => false,
                    'is_cancellable'           => true,
                    'days_before_cancellation' => 5,
                    'language'                 => 'English',
                    'certificate_enabled'      => true,
                    'certificate_name'         => 'Cardano Blockchain Fundamentals',
                    'certificate_description'  => 'Awarded for completing Introduction to Cardano Blockchain',
                    'token_reward_enabled'     => true,
                    'token_reward_amount'      => 100,
                ]
            );
            $course->categories()->syncWithoutDetaching([$category->id]);

            // ── Completed schedule (past — students finished here) ───
            $completedSchedule = CourseSchedule::firstOrCreate(
                ['course_id' => $course->id, 'start_datetime' => '2025-10-01 09:00:00'],
                [
                    'user_id'         => $teacher->id,
                    'end_datetime'    => '2025-10-15 17:00:00',
                    'max_participant' => 50,
                    'is_completed'    => true,
                ]
            );

            // ── Enroll all 3 students — completed, certificate-eligible ──
            // No exams on this course → hasPassedAllExams() returns true
            // → all students show as "eligible" on the teacher's certificate tab
            foreach ([$student1, $student2, $student3] as $s) {
                CourseHistory::firstOrCreate(
                    ['user_id' => $s->id, 'course_schedule_id' => $completedSchedule->id],
                    [
                        'course_id'                        => $course->id,
                        'completed_at'                     => '2025-10-15 17:00:00',
                        'is_cancelled'                     => false,
                        'enrolled_certificate_enabled'     => true,
                        'enrolled_certificate_name'        => 'Cardano Blockchain Fundamentals',
                        'enrolled_certificate_description' => 'Awarded for completing Introduction to Cardano Blockchain',
                        'enrolled_token_reward_enabled'    => true,
                        'enrolled_token_reward_amount'     => 100,
                    ]
                );
            }

            // ── Upcoming schedule (for future enrollment) ────────────
            CourseSchedule::firstOrCreate(
                ['course_id' => $course->id, 'start_datetime' => '2030-03-01 09:00:00'],
                [
                    'user_id'         => $teacher->id,
                    'end_datetime'    => '2030-03-15 17:00:00',
                    'max_participant' => 50,
                ]
            );
        });
    }

    private function upsertUser(array $identifiers, array $attributes): User
    {
        $user = User::firstOrNew($identifiers);

        $fillAttributes = array_merge([
            'first_name' => data_get($attributes, 'first_name', $user->first_name),
            'last_name'  => data_get($attributes, 'last_name', $user->last_name),
        ], $attributes);

        $user->forceFill(array_merge($fillAttributes, [
            'password'          => Hash::make(self::DEFAULT_PASSWORD),
            'email_verified_at' => now(),
            'is_enabled'        => true,
            'custodial_address' => 'addr_test1cert_demo_' . substr(md5($identifiers['email']), 0, 20),
        ]));
        $user->save();

        return $user->fresh();
    }
}
