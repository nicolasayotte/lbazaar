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
use App\Models\Setting;
use App\Models\Status;
use App\Models\StripePayment;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds demo accounts and course data for the Milestone 4 demo video.
 *
 * Accounts (password: Demo1234!):
 *   demo-student@lebazaar.com  — student, enrolled + one completed w/ rewards eligible
 *   demo-teacher@lebazaar.com  — teacher, owns all three demo courses
 *   demo-admin@lebazaar.com    — admin, for refund demo
 *
 * Courses:
 *   "Demo ADA Course"    — ¥6500, cert + token reward, student enrolled (not completed)
 *   "Demo Stripe Course" — ¥5800, no rewards, student enrolled (not completed)
 *   "Demo Reward Course" — ¥7000, cert + token reward, student COMPLETED, both rewards eligible
 */
class DemoVideoSeeder extends Seeder
{
    private const PASSWORD = 'Demo1234!';

    // Placeholder IPFS image for demo certificates. The `ipfs://` prefix is
    // stripped at metadata-build time; using a syntactically valid CID keeps
    // wallets and explorers happy when they fetch the NFT image.
    private const DEMO_CERTIFICATE_IMAGE_URL = 'ipfs://QmfKyJ4tuvHowwKQCbCHj4L5T3fSj8cjs7Aau8V7BWv226';

    public function run(): void
    {
        DB::transaction(function () {
            $country = Country::firstOrCreate(['code' => 'JPN'], ['name' => 'Japan']);

            foreach (['student', 'teacher', 'admin'] as $role) {
                Role::firstOrCreate(['name' => $role], ['display_name' => ucfirst($role)]);
            }

            $generalType = CourseType::firstOrCreate(
                ['name' => CourseType::GENERAL],
                ['type' => 'general']
            );

            $category = CourseCategory::firstOrCreate(['name' => 'Programming']);

            $published = Status::firstOrCreate(['name' => Status::PUBLISHED]);

            $classification = Classifications::firstOrCreate(
                ['name' => 'Professor'],
                ['commision_rate' => 70]
            );

            // ada-to-jpy fallback rate — required by CoursePurchaseService::convertJpyToAda
            // and ExchangeRateService::getFallbackRate. Without this row, "Buy with ADA"
            // throws "ADA to JPY conversion rate not configured".
            Setting::firstOrCreate(
                ['slug' => 'ada-to-jpy'],
                [
                    'name'     => 'ADA to JPY Exchange Rate (Fallback)',
                    'value'    => '65',
                    'type'     => 'number',
                    'category' => 'general',
                ]
            );

            // ── Accounts ─────────────────────────────────────────────
            $student = $this->upsertUser('demo-student@lebazaar.com', 'Demo', 'Student', $country->id);
            $teacher = $this->upsertUser('demo-teacher@lebazaar.com', 'Demo', 'Teacher', $country->id, $classification->id);
            $admin   = $this->upsertUser('demo-admin@lebazaar.com',   'Demo', 'Admin',   $country->id);

            foreach ([[$student, 'student'], [$teacher, 'teacher'], [$admin, 'admin']] as [$user, $role]) {
                if (! $user->hasRole($role)) {
                    $user->attachRole($role);
                }
                UserWallet::firstOrCreate(['user_id' => $user->id], ['points' => 0, 'badges' => 0, 'credit' => 0]);
            }

            // ── Demo ADA Course (¥6500, cert + token reward, not completed) ──
            $adaCourse = $this->upsertCourse($teacher, $generalType, $published, $category, [
                'title'                      => 'Demo ADA Course',
                'description'                => 'Blockchain fundamentals — paid with ADA for the demo video.',
                'price'                      => 6500,
                'certificate_enabled'        => true,
                'certificate_name'           => 'Blockchain Fundamentals Certificate',
                'certificate_description'    => 'Awarded for completing the Demo ADA Course',
                'certificate_image_url'      => self::DEMO_CERTIFICATE_IMAGE_URL,
                'token_reward_enabled'       => true,
                'token_reward_amount'        => 100,
            ]);

            $adaSchedule = CourseSchedule::firstOrCreate(
                ['course_id' => $adaCourse->id, 'start_datetime' => '2030-06-01 10:00:00'],
                ['user_id' => $teacher->id, 'end_datetime' => '2030-06-30 17:00:00', 'max_participant' => 50]
            );

            // Student enrolled, not completed
            CourseHistory::firstOrCreate(
                ['user_id' => $student->id, 'course_schedule_id' => $adaSchedule->id],
                [
                    'course_id'    => $adaCourse->id,
                    'completed_at' => null,
                    'is_cancelled' => false,
                ]
            );

            // ── Demo Stripe Course (¥5800, no rewards, not completed) ──
            $stripeCourse = $this->upsertCourse($teacher, $generalType, $published, $category, [
                'title'       => 'Demo Stripe Course',
                'description' => 'Web development essentials — paid with credit card for the demo video.',
                'price'       => 5800,
            ]);

            $stripeSchedule = CourseSchedule::firstOrCreate(
                ['course_id' => $stripeCourse->id, 'start_datetime' => '2030-07-01 10:00:00'],
                ['user_id' => $teacher->id, 'end_datetime' => '2030-07-31 17:00:00', 'max_participant' => 50]
            );

            CourseHistory::firstOrCreate(
                ['user_id' => $student->id, 'course_schedule_id' => $stripeSchedule->id],
                [
                    'course_id'    => $stripeCourse->id,
                    'completed_at' => null,
                    'is_cancelled' => false,
                ]
            );

            // ── Demo Reward Course (¥7000, cert + token, COMPLETED, both eligible) ──
            $rewardCourse = $this->upsertCourse($teacher, $generalType, $published, $category, [
                'title'                      => 'Demo Reward Course',
                'description'                => 'Smart contract development — completed course for the reward minting demo.',
                'price'                      => 7000,
                'certificate_enabled'        => true,
                'certificate_name'           => 'Smart Contract Developer Certificate',
                'certificate_description'    => 'Awarded for completing the Demo Reward Course',
                'certificate_image_url'      => self::DEMO_CERTIFICATE_IMAGE_URL,
                'token_reward_enabled'       => true,
                'token_reward_amount'        => 100,
            ]);

            $rewardSchedule = CourseSchedule::firstOrCreate(
                ['course_id' => $rewardCourse->id, 'start_datetime' => '2024-09-01 09:00:00'],
                [
                    'user_id'        => $teacher->id,
                    'end_datetime'   => '2024-09-30 17:00:00',
                    'max_participant' => 50,
                    'is_completed'   => true,
                ]
            );

            // Student completed, both rewards eligible
            $rewardHistory = CourseHistory::updateOrCreate(
                ['user_id' => $student->id, 'course_schedule_id' => $rewardSchedule->id],
                [
                    'course_id'                        => $rewardCourse->id,
                    'completed_at'                     => '2024-09-30 17:00:00',
                    'is_cancelled'                     => false,
                    'enrolled_certificate_enabled'     => true,
                    'enrolled_certificate_name'        => $rewardCourse->certificate_name,
                    'enrolled_certificate_description' => $rewardCourse->certificate_description,
                    'enrolled_certificate_image_url'   => $rewardCourse->certificate_image_url,
                    'certificate_status'               => 'eligible',
                    'enrolled_token_reward_enabled'    => true,
                    'enrolled_token_reward_amount'     => 100,
                    'token_reward_status'              => 'eligible',
                ]
            );

            // A successful Stripe payment for the completed Demo Reward Course
            // — gives the admin refund panel one refundable row to demo against.
            StripePayment::updateOrCreate(
                ['stripe_payment_intent_id' => 'pi_demo_reward_course_succeeded'],
                [
                    'user_id'           => $student->id,
                    'course_id'         => $rewardCourse->id,
                    'course_history_id' => $rewardHistory->id,
                    'amount'            => 7000,
                    'currency'          => 'jpy',
                    'status'            => 'succeeded',
                ]
            );
        });
    }

    private function upsertUser(string $email, string $first, string $last, int $countryId, ?int $classificationId = null): User
    {
        $user = User::firstOrNew(['email' => $email]);
        $attrs = [
            'first_name'          => $first,
            'last_name'           => $last,
            'country_id'          => $countryId,
            'password'            => Hash::make(self::PASSWORD),
            'email_verified_at'   => now(),
            'is_enabled'          => true,
            'custodial_address'   => 'addr_test1demo_dummy_address',
        ];
        if ($classificationId) {
            $attrs['classification_id'] = $classificationId;
            $attrs['commission_rate']   = 70;
        }
        $user->forceFill($attrs)->save();
        return $user->fresh();
    }

    private function upsertCourse(User $teacher, CourseType $type, Status $status, CourseCategory $category, array $attrs): Course
    {
        $application = CourseApplication::firstOrCreate(
            ['professor_id' => $teacher->id, 'title' => $attrs['title']],
            [
                'course_type_id'   => $type->id,
                'description'      => $attrs['description'],
                'price'            => $attrs['price'],
                'points_earned'    => 0,
                'max_participant'  => 50,
                'is_live'          => false,
                'approved_at'      => now(),
                'length'           => '02:00:00',
                'lecture_frequency' => 'weekly',
            ]
        );
        $application->categories()->syncWithoutDetaching([$category->id]);

        $course = Course::firstOrCreate(
            ['course_application_id' => $application->id],
            array_merge([
                'professor_id'           => $teacher->id,
                'status_id'              => $status->id,
                'course_type_id'         => $type->id,
                'points_earned'          => 0,
                'max_participant'        => 50,
                'is_live'                => false,
                'is_cancellable'         => true,
                'days_before_cancellation' => 3,
                'language'               => 'English',
                'video_path'             => 'https://www.youtube.com/embed/R3wiX05SJps',
                'certificate_enabled'    => false,
                'token_reward_enabled'   => false,
            ], $attrs)
        );
        $course->categories()->syncWithoutDetaching([$category->id]);

        return $course;
    }
}
