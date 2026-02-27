<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use App\Services\API\TokenRewardService;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Nft;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Support\Facades\Log;
use Mockery;

class TokenRewardServiceTest extends TestCase
{
    protected TokenRewardService $service;
    protected User $teacher;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->retryOnDisconnect(fn () => $this->setupTestData());

        $this->service = Mockery::mock(TokenRewardService::class)
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();
    }

    private function setupTestData(): void
    {
        $this->createRoles(['teacher', 'student']);
        $courseType = $this->createCourseType();

        $this->teacher = $this->createTestUser();
        $this->teacher->attachRole('teacher');

        $this->student = $this->createTestUser([
            'custodial_address' => 'addr_test1qzstudent_custodial_reward',
        ]);
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'course_type_id'      => $courseType->id,
            'token_reward_enabled' => false,
            'token_reward_amount'  => null,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id'   => $this->teacher->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // updateTokenRewardConfig tests
    // -------------------------------------------------------------------------

    public function test_update_token_reward_config_enables_with_amount(): void
    {
        // Use a real service instance for this DB-level test
        $service = new TokenRewardService();

        $result = $service->updateTokenRewardConfig($this->course, true, 500);

        $this->assertTrue($result['success']);
        $this->assertEquals('Token reward configuration updated.', $result['message']);
        $this->assertTrue($result['data']['token_reward_enabled']);
        $this->assertEquals(500, $result['data']['token_reward_amount']);

        // Verify database state
        $this->course->refresh();
        $this->assertTrue((bool) $this->course->token_reward_enabled);
        $this->assertEquals(500, $this->course->token_reward_amount);
    }

    public function test_update_token_reward_config_disables_clears_amount(): void
    {
        // Pre-enable the course
        $this->course->token_reward_enabled = true;
        $this->course->token_reward_amount  = 100;
        $this->course->save();

        $service = new TokenRewardService();

        $result = $service->updateTokenRewardConfig($this->course, false, null);

        $this->assertTrue($result['success']);
        $this->assertFalse($result['data']['token_reward_enabled']);
        $this->assertNull($result['data']['token_reward_amount']);

        // Verify database state
        $this->course->refresh();
        $this->assertFalse((bool) $this->course->token_reward_enabled);
        $this->assertNull($this->course->token_reward_amount);
    }

    // -------------------------------------------------------------------------
    // mintAndAirdropTokenReward pre-condition checks
    // -------------------------------------------------------------------------

    public function test_mint_returns_error_when_reward_disabled(): void
    {
        // Course has token reward disabled
        $this->course->token_reward_enabled = false;
        $this->course->token_reward_amount  = 100;
        $this->course->save();

        $service = new TokenRewardService();

        $result = $service->mintAndAirdropTokenReward($this->course, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not enabled', $result['message']);
    }

    public function test_mint_returns_error_when_amount_not_configured(): void
    {
        // Course has token reward enabled but no amount set
        $this->course->token_reward_enabled = true;
        $this->course->token_reward_amount  = null;
        $this->course->save();

        $service = new TokenRewardService();

        $result = $service->mintAndAirdropTokenReward($this->course, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('amount is not configured', $result['message']);
    }

    // -------------------------------------------------------------------------
    // updateTokenRewardStatus tests
    // -------------------------------------------------------------------------

    public function test_update_token_reward_status_writes_correct_fields(): void
    {
        // Create a history record to update
        $history = CourseHistory::factory()->create([
            'user_id'           => $this->student->id,
            'course_id'         => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at'      => now()->subDay(),
        ]);

        $service = new TokenRewardService();
        $txHash  = str_repeat('a', 64);

        $service->updateTokenRewardStatus(
            $this->course->id,
            $this->student->id,
            'minted',
            $this->schedule->id,
            $txHash
        );

        $history->refresh();
        $this->assertEquals('minted', $history->token_reward_status);
        $this->assertEquals($txHash, $history->token_reward_tx_hash);
        $this->assertNotNull($history->token_reward_minted_at);
    }

    public function test_update_token_reward_status_noop_when_no_history(): void
    {
        Log::shouldReceive('warning')->once()->with(
            'CourseHistory not found for token reward status update',
            Mockery::any()
        );

        $service = new TokenRewardService();

        // Call with non-existent course_id — should not throw
        $service->updateTokenRewardStatus(
            999999,
            999999,
            'failed',
            null,
            null
        );

        // If we reach here without exception, the test passes
        $this->assertTrue(true);
    }
}
