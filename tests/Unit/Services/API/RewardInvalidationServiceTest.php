<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use App\Services\API\RewardInvalidationService;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Mockery;

class RewardInvalidationServiceTest extends TestCase
{
    protected RewardInvalidationService $service;
    protected User $admin;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;
    protected UserRepository $userRepository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->retryOnDisconnect(fn () => $this->setupTestData());
    }

    private function setupTestData(): void
    {
        $this->createRoles(['teacher', 'student', 'admin']);
        $courseType = $this->createCourseType();

        $this->admin = $this->createTestUser();
        $this->admin->attachRole('admin');

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

        // Set up a UserRepository mock that returns the admin
        $this->userRepository = Mockery::mock(UserRepository::class);
        $this->userRepository->shouldReceive('getAdmin')
            ->andReturn($this->admin)
            ->byDefault();

        $this->service = new RewardInvalidationService($this->userRepository);
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
        ], $attributes));
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    public function test_no_op_when_no_rewards_delivered(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => 'eligible',
            'token_reward_status' => null,
        ]);

        $result = $this->service->invalidateRewards($history);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString('No rewards delivered', $result['message']);

        $history->refresh();
        $this->assertNotNull($history->rewards_invalidated_at);
        // Statuses unchanged
        $this->assertEquals('eligible', $history->certificate_status);
        $this->assertNull($history->token_reward_status);
    }

    public function test_revokes_certificate_when_minted(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => 'minted',
            'token_reward_status' => null,
        ]);

        $result = $this->service->invalidateRewards($history);

        $this->assertTrue($result['success']);

        $history->refresh();
        $this->assertEquals('revoked', $history->certificate_status);
        $this->assertNotNull($history->rewards_invalidated_at);
    }

    public function test_flags_token_for_clawback_when_minted(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => null,
            'token_reward_status' => 'minted',
        ]);

        $result = $this->service->invalidateRewards($history);

        $this->assertTrue($result['success']);

        $history->refresh();
        $this->assertEquals('clawback_flagged', $history->token_reward_status);
        $this->assertNotNull($history->rewards_invalidated_at);
    }

    public function test_revokes_both_when_both_delivered(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => 'minted',
            'token_reward_status' => 'minted',
        ]);

        $result = $this->service->invalidateRewards($history);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['data']['certificate_revoked']);
        $this->assertTrue($result['data']['token_flagged']);

        $history->refresh();
        $this->assertEquals('revoked', $history->certificate_status);
        $this->assertEquals('clawback_flagged', $history->token_reward_status);
        $this->assertNotNull($history->rewards_invalidated_at);
    }

    public function test_idempotent_when_already_invalidated(): void
    {
        $history = $this->makeHistory([
            'certificate_status'      => 'minted',
            'token_reward_status'     => null,
            'rewards_invalidated_at'  => now()->subMinutes(5),
        ]);

        $result = $this->service->invalidateRewards($history);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString('already invalidated', $result['message']);

        // Certificate status should NOT have changed because we returned early
        $history->refresh();
        $this->assertEquals('minted', $history->certificate_status);
    }

    public function test_notifies_student_on_certificate_revocation(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => 'minted',
            'token_reward_status' => null,
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->student->id)->count();

        $this->service->invalidateRewards($history);

        $after = DB::table('notifications')->where('to_user_id', $this->student->id)->count();
        $this->assertGreaterThan($before, $after);
    }

    public function test_notifies_admin_on_certificate_revocation(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => 'minted',
            'token_reward_status' => null,
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->admin->id)->count();

        $this->service->invalidateRewards($history);

        $after = DB::table('notifications')->where('to_user_id', $this->admin->id)->count();
        $this->assertGreaterThan($before, $after);
    }

    public function test_notifies_admin_on_token_clawback(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => null,
            'token_reward_status' => 'minted',
        ]);

        $before = DB::table('notifications')->where('to_user_id', $this->admin->id)->count();

        $this->service->invalidateRewards($history);

        $after = DB::table('notifications')->where('to_user_id', $this->admin->id)->count();
        $this->assertGreaterThan($before, $after);
    }

    public function test_flags_clawback_when_token_minting_in_progress(): void
    {
        $history = $this->makeHistory([
            'certificate_status'  => null,
            'token_reward_status' => 'minting',
        ]);

        $result = $this->service->invalidateRewards($history);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['data']['token_flagged']);

        $history->refresh();
        $this->assertEquals('clawback_flagged', $history->token_reward_status);
    }

    public function test_does_not_revoke_certificate_when_not_minted(): void
    {
        // Status is 'eligible' — not yet minted, so should not be revoked
        $history = $this->makeHistory([
            'certificate_status'  => 'eligible',
            'token_reward_status' => 'minted',
        ]);

        $result = $this->service->invalidateRewards($history);

        $this->assertTrue($result['success']);
        $this->assertFalse($result['data']['certificate_revoked']);
        $this->assertTrue($result['data']['token_flagged']);

        $history->refresh();
        // Certificate status unchanged
        $this->assertEquals('eligible', $history->certificate_status);
        $this->assertEquals('clawback_flagged', $history->token_reward_status);
    }
}
