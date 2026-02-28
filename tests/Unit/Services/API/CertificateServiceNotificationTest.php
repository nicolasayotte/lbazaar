<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use App\Services\API\CertificateService;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CertificateServiceNotificationTest extends TestCase
{
    protected CertificateService $service;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->retryOnDisconnect(fn () => $this->setupTestData());
    }

    private function setupTestData(): void
    {
        $this->createRoles(['teacher', 'student', 'admin']);
        $courseType = $this->createCourseType();

        $teacher = $this->createTestUser();
        $teacher->attachRole('teacher');

        $this->student = $this->createTestUser();
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id'   => $teacher->id,
            'course_type_id' => $courseType->id,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id'   => $teacher->id,
        ]);

        $this->service = new CertificateService();
    }

    // -------------------------------------------------------------------------
    // Helper to create a CourseHistory for the test student/course
    // -------------------------------------------------------------------------

    private function makeHistory(array $attributes = []): CourseHistory
    {
        return CourseHistory::factory()->create(array_merge([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at'       => now()->subHour(),
        ], $attributes));
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    public function test_dispatches_notification_when_certificate_enabled(): void
    {
        $history = $this->makeHistory([
            'enrolled_certificate_enabled' => true,
            'enrolled_token_reward_enabled' => false,
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->student->id)->count();

        $this->service->dispatchCompletionNotificationIfEligible($history);

        $after = DB::table('notifications')->where('to_user_id', $this->student->id)->count();
        $this->assertGreaterThan($before, $after);

        $history->refresh();
        $this->assertNotNull($history->rewards_notification_sent_at);
    }

    public function test_dispatches_notification_when_token_enabled(): void
    {
        // enrolled_certificate_enabled = false (non-null) activates the snapshot path;
        // effectiveTokenRewardEnabled() will then return enrolled_token_reward_enabled = true.
        $history = $this->makeHistory([
            'enrolled_certificate_enabled'  => false,
            'enrolled_token_reward_enabled' => true,
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->student->id)->count();

        $this->service->dispatchCompletionNotificationIfEligible($history);

        $after = DB::table('notifications')->where('to_user_id', $this->student->id)->count();
        $this->assertGreaterThan($before, $after);

        $history->refresh();
        $this->assertNotNull($history->rewards_notification_sent_at);

        // Verify the correct lang key was used (token-only message)
        $notification = DB::table('notifications')
            ->where('to_user_id', $this->student->id)
            ->latest('created_at')
            ->first();
        $this->assertStringContainsString('token', strtolower($notification->message));
    }

    public function test_dispatches_notification_when_both_enabled(): void
    {
        $history = $this->makeHistory([
            'enrolled_certificate_enabled'  => true,
            'enrolled_token_reward_enabled' => true,
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->student->id)->count();

        $this->service->dispatchCompletionNotificationIfEligible($history);

        $after = DB::table('notifications')->where('to_user_id', $this->student->id)->count();
        $this->assertEquals($before + 1, $after);

        $history->refresh();
        $this->assertNotNull($history->rewards_notification_sent_at);
    }

    public function test_does_not_dispatch_when_no_rewards(): void
    {
        // Both disabled: enrolled_certificate_enabled = false (non-null triggers snapshot path),
        // enrolled_token_reward_enabled = false — so neither reward is active.
        $history = $this->makeHistory([
            'enrolled_certificate_enabled'  => false,
            'enrolled_token_reward_enabled' => false,
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->student->id)->count();

        $this->service->dispatchCompletionNotificationIfEligible($history);

        $after = DB::table('notifications')->where('to_user_id', $this->student->id)->count();
        $this->assertEquals($before, $after);

        $history->refresh();
        $this->assertNull($history->rewards_notification_sent_at);
    }

    public function test_idempotent_no_duplicate_when_already_notified(): void
    {
        $sentAt = now()->subMinutes(10);

        $history = $this->makeHistory([
            'enrolled_certificate_enabled'   => true,
            'enrolled_token_reward_enabled'  => false,
            'rewards_notification_sent_at'   => $sentAt,
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->student->id)->count();

        $this->service->dispatchCompletionNotificationIfEligible($history);

        $after = DB::table('notifications')->where('to_user_id', $this->student->id)->count();
        $this->assertEquals($before, $after, 'No new notification should be inserted when already notified');
    }
}
