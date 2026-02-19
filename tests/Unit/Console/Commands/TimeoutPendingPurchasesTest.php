<?php

namespace Tests\Unit\Console\Commands;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Services\API\CoursePurchaseService;
use Mockery;

class TimeoutPendingPurchasesTest extends TestCase
{
    protected User $teacher;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createRoles(['teacher', 'student']);

        $this->teacher = User::withoutEvents(function () {
            return User::factory()->create([
                'custodial_address' => 'addr1test_teacher_' . uniqid(),
            ]);
        });
        $this->teacher->attachRole('teacher');

        $this->student = User::withoutEvents(function () {
            return User::factory()->create([
                'custodial_address' => 'addr1test_student_' . uniqid(),
            ]);
        });
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);
    }

    public function test_command_marks_timed_out_payments_as_failed(): void
    {
        // Set timeout to 30 minutes
        config(['services.cardano.payment_timeout_minutes' => 30]);

        // Create 2 stale pending CourseHistory records (submitted 2 hours ago)
        $history1 = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'stale_tx_hash_1_' . uniqid(),
            'payment_submitted_at' => now()->subHours(2),
        ]);

        $history2 = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'stale_tx_hash_2_' . uniqid(),
            'payment_submitted_at' => now()->subHours(2),
        ]);

        // Mock CoursePurchaseService
        $mockService = Mockery::mock(CoursePurchaseService::class);
        $mockService->shouldReceive('failPurchaseTransaction')
            ->twice()
            ->andReturn(['success' => true, 'message' => 'Purchase marked as failed']);

        $this->app->instance(CoursePurchaseService::class, $mockService);

        $this->artisan('purchases:timeout')->assertExitCode(0);
    }

    public function test_command_skips_confirmed_and_non_pending_payments(): void
    {
        config(['services.cardano.payment_timeout_minutes' => 30]);

        // Create a confirmed record (old)
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'confirmed',
            'payment_tx_hash' => 'confirmed_tx_hash_' . uniqid(),
            'payment_submitted_at' => now()->subHours(2),
            'payment_confirmed_at' => now()->subHour(),
        ]);

        // Create a failed record (old)
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'failed',
            'payment_tx_hash' => 'failed_tx_hash_' . uniqid(),
            'payment_submitted_at' => now()->subHours(2),
        ]);

        // Mock CoursePurchaseService — must NOT be called
        $mockService = Mockery::mock(CoursePurchaseService::class);
        $mockService->shouldNotReceive('failPurchaseTransaction');

        $this->app->instance(CoursePurchaseService::class, $mockService);

        $this->artisan('purchases:timeout')->assertExitCode(0);
    }

    public function test_dry_run_does_not_call_service(): void
    {
        config(['services.cardano.payment_timeout_minutes' => 30]);

        // Create 1 stale pending CourseHistory record
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'dryrun_tx_hash_' . uniqid(),
            'payment_submitted_at' => now()->subHours(2),
        ]);

        // Mock service — must NOT be called when --dry-run is passed
        $mockService = Mockery::mock(CoursePurchaseService::class);
        $mockService->shouldNotReceive('failPurchaseTransaction');

        $this->app->instance(CoursePurchaseService::class, $mockService);

        $this->artisan('purchases:timeout', ['--dry-run' => true])->assertExitCode(0);
    }

    public function test_command_exits_without_timeout_configured(): void
    {
        // Set timeout to 0 to trigger the fallback warning
        config(['services.cardano.payment_timeout_minutes' => 0]);

        // Create a stale pending record
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'fallback_tx_hash_' . uniqid(),
            'payment_submitted_at' => now()->subHours(2),
        ]);

        // Mock service — still expects a call because the default 30-minute cutoff applies
        $mockService = Mockery::mock(CoursePurchaseService::class);
        $mockService->shouldReceive('failPurchaseTransaction')
            ->once()
            ->andReturn(['success' => true, 'message' => 'Purchase marked as failed']);

        $this->app->instance(CoursePurchaseService::class, $mockService);

        // Command should still succeed and output the warning about the missing env var
        $this->artisan('purchases:timeout')
            ->expectsOutputToContain('ADA_PAYMENT_TIMEOUT_MINUTES is set to 0 or invalid')
            ->assertExitCode(0);
    }
}
