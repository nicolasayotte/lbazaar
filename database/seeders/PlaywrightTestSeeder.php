<?php

namespace Database\Seeders;

use App\Models\Classifications;
use App\Models\Country;
use App\Models\Course;
use App\Models\Setting;
use App\Models\CourseApplication;
use App\Models\CourseCategory;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\CourseType;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\ExamItemChoice;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use App\Models\UserCertification;
use App\Models\UserEducation;
use App\Models\Nft;
use App\Models\UserWallet;
use App\Models\UserWorkHistory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PlaywrightTestSeeder extends Seeder
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

            $generalType = CourseType::firstOrCreate(
                ['name' => CourseType::GENERAL],
                ['type' => 'general']
            );

            $category = CourseCategory::firstOrCreate(
                ['name' => 'Programming']
            );

            $publishedStatus = Status::firstOrCreate(
                ['name' => Status::PUBLISHED]
            );

            $classification = Classifications::firstOrCreate(
                ['name' => 'Professor'],
                ['commision_rate' => 70]
            );

            Setting::firstOrCreate(
                ['slug' => 'ada-to-jpy'],
                ['name' => 'ADA to JPY Rate', 'value' => '65', 'type' => 'number', 'category' => 'exchange_rate']
            );

            // ── Users ───────────────────────────────────────────────
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
                    'classification_id' => $classification->id,
                    'commission_rate' => 70,
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

            // ── Wallets ─────────────────────────────────────────────
            UserWallet::firstOrCreate(
                ['user_id' => $student->id],
                ['points' => 100000, 'badges' => 0, 'credit' => 0]
            );

            UserWallet::firstOrCreate(
                ['user_id' => $teacher->id],
                ['points' => 0, 'badges' => 0, 'credit' => 0]
            );

            UserWallet::firstOrCreate(
                ['user_id' => $admin->id],
                ['points' => 0, 'badges' => 0, 'credit' => 0]
            );

            // ── Course Application (approved, no course yet) ────────
            $pendingApplication = CourseApplication::firstOrCreate(
                ['professor_id' => $teacher->id, 'title' => 'PW Pending Application'],
                [
                    'course_type_id' => $generalType->id,
                    'description' => 'A pending course application for Playwright tests',
                    'price' => 5,
                    'points_earned' => 0,
                    'max_participant' => 50,
                    'is_live' => false,
                    'approved_at' => now(),
                    'length' => '01:00:00',
                    'lecture_frequency' => 'weekly',
                ]
            );
            $pendingApplication->categories()->syncWithoutDetaching([$category->id]);

            // ── Course Application (approved, with course) ──────────
            $application = CourseApplication::firstOrCreate(
                ['professor_id' => $teacher->id, 'title' => 'PW Test Course'],
                [
                    'course_type_id' => $generalType->id,
                    'description' => 'A test course for Playwright end-to-end tests',
                    'price' => 8,
                    'points_earned' => 0,
                    'max_participant' => 100,
                    'is_live' => false,
                    'approved_at' => now(),
                    'length' => '01:00:00',
                    'lecture_frequency' => 'weekly',
                ]
            );
            $application->categories()->syncWithoutDetaching([$category->id]);

            // ── Course ──────────────────────────────────────────────
            $course = Course::firstOrCreate(
                ['course_application_id' => $application->id],
                [
                    'title' => $application->title,
                    'description' => $application->description,
                    'professor_id' => $teacher->id,
                    'status_id' => $publishedStatus->id,
                    'course_type_id' => $generalType->id,
                    'price' => $application->price,
                    'points_earned' => 0,
                    'max_participant' => $application->max_participant,
                    'is_live' => false,
                    'is_cancellable' => true,
                    'days_before_cancellation' => 3,
                    'language' => 'English',
                    'video_path' => 'https://www.youtube.com/embed/R3wiX05SJps',
                    'certificate_enabled' => true,
                    'certificate_name' => 'PW Test Certificate',
                    'certificate_description' => 'Awarded for completing the PW Test Course',
                ]
            );
            $course->categories()->syncWithoutDetaching([$category->id]);

            // ── Course Schedule (upcoming — for attend tests) ───────
            $schedule = CourseSchedule::firstOrCreate(
                ['course_id' => $course->id, 'start_datetime' => '2030-01-15 09:00:00'],
                [
                    'user_id' => $teacher->id,
                    'end_datetime' => '2030-01-29 17:00:00',
                    'max_participant' => 100,
                ]
            );

            // ── Exam with questions ─────────────────────────────────
            $exam = Exam::firstOrCreate(
                ['course_id' => $course->id, 'name' => 'PW Test Exam'],
                ['published_at' => now()]
            );

            $item1 = ExamItem::firstOrCreate(
                ['exam_id' => $exam->id, 'question' => 'What is 2 + 2?'],
                ['points' => 10, 'sort' => 1]
            );

            $choice1a = ExamItemChoice::firstOrCreate(
                ['exam_item_id' => $item1->id, 'value' => '4', 'sort' => 1]
            );
            ExamItemChoice::firstOrCreate(
                ['exam_item_id' => $item1->id, 'value' => '5', 'sort' => 2]
            );
            if (! $item1->correct_choice_id) {
                $item1->update(['correct_choice_id' => $choice1a->id]);
            }

            $item2 = ExamItem::firstOrCreate(
                ['exam_id' => $exam->id, 'question' => 'What language is Laravel written in?'],
                ['points' => 10, 'sort' => 2]
            );

            $choice2a = ExamItemChoice::firstOrCreate(
                ['exam_item_id' => $item2->id, 'value' => 'PHP', 'sort' => 1]
            );
            ExamItemChoice::firstOrCreate(
                ['exam_item_id' => $item2->id, 'value' => 'Python', 'sort' => 2]
            );
            if (! $item2->correct_choice_id) {
                $item2->update(['correct_choice_id' => $choice2a->id]);
            }

            // ── Enroll pw-student in upcoming schedule ──
            CourseHistory::firstOrCreate(
                ['user_id' => $student->id, 'course_schedule_id' => $schedule->id],
                [
                    'course_id' => $course->id,
                    'completed_at' => null,
                    'is_cancelled' => false,
                ]
            );

            // ── Ongoing schedule (for attend tests — F-08.x) ──────────
            // Uses max_participant=99 as a stable identifier to avoid colliding
            // with the upcoming (100) and completed (100) schedules.
            $ongoingStart = now()->subDay()->startOfDay()->toDateTimeString();
            $ongoingEnd   = now()->addWeek()->endOfDay()->toDateTimeString();

            $ongoingSchedule = CourseSchedule::updateOrCreate(
                ['course_id' => $course->id, 'max_participant' => 99],
                [
                    'user_id' => $teacher->id,
                    'start_datetime' => $ongoingStart,
                    'end_datetime' => $ongoingEnd,
                ]
            );

            CourseHistory::firstOrCreate(
                ['user_id' => $student->id, 'course_schedule_id' => $ongoingSchedule->id],
                [
                    'course_id' => $course->id,
                    'completed_at' => null,
                    'is_cancelled' => false,
                ]
            );

            // ── Second schedule (completed — for teaching-history tests) ──
            $completedSchedule = CourseSchedule::firstOrCreate(
                ['course_id' => $course->id, 'start_datetime' => '2024-06-01 09:00:00'],
                [
                    'user_id' => $teacher->id,
                    'end_datetime' => '2024-06-15 17:00:00',
                    'max_participant' => 100,
                    'is_completed' => true,
                ]
            );

            CourseHistory::updateOrCreate(
                ['user_id' => $student->id, 'course_schedule_id' => $completedSchedule->id],
                [
                    'course_id' => $course->id,
                    'completed_at' => '2024-06-15 17:00:00',
                    'is_cancelled' => false,
                    'enrolled_certificate_enabled' => true,
                    'enrolled_certificate_name' => $course->certificate_name,
                    'enrolled_certificate_description' => $course->certificate_description,
                    'certificate_status' => 'eligible',
                ]
            );

            // ── Teacher information ─────────────────────────────────
            UserEducation::firstOrCreate(
                ['user_id' => $teacher->id, 'school' => 'PW Test University'],
                [
                    'degree' => 'MS in Computer Science',
                    'start_date' => '2015-04-01',
                    'end_date' => '2017-03-31',
                ]
            );

            UserCertification::firstOrCreate(
                ['user_id' => $teacher->id, 'title' => 'PW Teaching Certificate'],
                [
                    'awarded_at' => '2018-06-15',
                    'awarded_by' => 'PW Certification Board',
                ]
            );

            UserWorkHistory::firstOrCreate(
                ['user_id' => $teacher->id, 'company' => 'PW Tech Corp'],
                [
                    'position' => 'Senior Instructor',
                    'start_date' => '2018-04-01',
                    'end_date' => '2023-03-31',
                    'description' => 'Teaching programming courses',
                ]
            );

            // ── Seeded NFT (for F-08.2b/c edit/delete tests) ─────────
            Nft::firstOrCreate(
                ['name' => 'E2E-Seeded-NFT'],
                [
                    'mph' => 'e2e_test_placeholder_mph',
                    'image_url' => 'QmE2ETestCID',
                    'points' => 0,
                    'for_sale' => 0,
                ]
            );

            // ── Available application (for F-03.3 create-course test) ─
            $availableApplication = CourseApplication::firstOrCreate(
                ['professor_id' => $teacher->id, 'title' => 'PW Available Application'],
                [
                    'course_type_id' => $generalType->id,
                    'description' => 'Approved application kept available for course-creation tests',
                    'price' => 7,
                    'points_earned' => 0,
                    'max_participant' => 50,
                    'is_live' => false,
                    'approved_at' => now(),
                    'length' => '01:00:00',
                    'lecture_frequency' => 'weekly',
                ]
            );
            $availableApplication->categories()->syncWithoutDetaching([$category->id]);
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
