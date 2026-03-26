<?php

namespace Tests\Unit\Services\API;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\StripePayment;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\API\RewardInvalidationService;
use App\Services\API\StripeService;
use stdClass;
use Tests\TestCase;

/**
 * Unit tests for StripeService::handleChargeback() (via handleWebhook).
 *
 * Uses the private method indirectly through handleWebhook() with a mocked
 * Stripe Webhook event, since handleChargeback() is private.
 *
 * Tests:
 *  1. Chargeback with no payment_intent logs and returns success (graceful)
 *  2. Chargeback for unknown payment intent logs and returns success (idempotent)
 *  3. Chargeback revokes course access (sets is_cancelled = true)
 *  4. Chargeback stores dispute metadata on the StripePayment record
 */
class StripeChargebackTest extends TestCase
{
    protected StripeService $service;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setupTestData();
        $this->service = new StripeService(app(RewardInvalidationService::class), app(UserRepository::class));
    }

    private function setupTestData(): void
    {
        $this->createRoles(['student', 'teacher']);

        $teacher = User::withoutEvents(fn () => User::factory()->create([
            'email' => 'chargeback-teacher@example.com',
            'custodial_address' => 'addr1test_chargeback_teacher',
        ]));
        $teacher->attachRole('teacher');

        $this->student = User::withoutEvents(fn () => User::factory()->create([
            'email' => 'chargeback-student@example.com',
            'custodial_address' => 'addr1test_chargeback_student',
        ]));
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id' => $teacher->id,
            'price'        => 3000,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id'   => $teacher->id,
        ]);
    }

    /**
     * Build a fake Stripe charge.dispute.created event object.
     *
     * We call handleWebhook() which requires signature verification,
     * so instead we test handleChargeback() via reflection to avoid
     * needing a real Stripe webhook secret.
     */
    private function callHandleChargeback(object $dispute): array
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handleChargeback');
        $method->setAccessible(true);
        return $method->invoke($this->service, $dispute);
    }

    private function makeDispute(?string $paymentIntentId, string $disputeId = 'dp_test_001', ?string $reason = 'fraudulent'): stdClass
    {
        $dispute = new stdClass();
        $dispute->id = $disputeId;
        $dispute->payment_intent = $paymentIntentId;
        $dispute->reason = $reason;
        return $dispute;
    }

    /** Test 1: No payment_intent on dispute — logs gracefully, returns success */
    public function test_chargeback_with_no_payment_intent_returns_success(): void
    {
        $dispute = $this->makeDispute(null);

        $result = $this->callHandleChargeback($dispute);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString('no payment_intent', $result['message']);
    }

    /** Test 2: Unknown payment intent — logs gracefully, returns success (idempotent) */
    public function test_chargeback_for_unknown_payment_intent_returns_success(): void
    {
        $dispute = $this->makeDispute('pi_nonexistent_xyz_999');

        $result = $this->callHandleChargeback($dispute);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString('payment not found', $result['message']);
    }

    /** Test 3: Known payment with course history — is_cancelled set to true */
    public function test_chargeback_revokes_course_access(): void
    {
        $courseHistory = CourseHistory::factory()->create([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'is_cancelled'       => false,
        ]);

        $payment = StripePayment::factory()->create([
            'user_id'                  => $this->student->id,
            'course_id'                => $this->course->id,
            'course_history_id'        => $courseHistory->id,
            'stripe_payment_intent_id' => 'pi_test_chargeback_revoke',
            'status'                   => 'succeeded',
            'metadata'                 => [],
        ]);

        $dispute = $this->makeDispute('pi_test_chargeback_revoke', 'dp_test_revoke');

        $result = $this->callHandleChargeback($dispute);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString('access revoked', $result['message']);

        $courseHistory->refresh();
        $this->assertTrue((bool) $courseHistory->is_cancelled, 'Course access must be revoked after chargeback');
    }

    /** Test 4: Chargeback metadata stored on StripePayment record */
    public function test_chargeback_stores_dispute_metadata(): void
    {
        $payment = StripePayment::factory()->create([
            'user_id'                  => $this->student->id,
            'course_id'                => $this->course->id,
            'course_history_id'        => null,
            'stripe_payment_intent_id' => 'pi_test_chargeback_meta',
            'status'                   => 'succeeded',
            'metadata'                 => [],
        ]);

        $dispute = $this->makeDispute('pi_test_chargeback_meta', 'dp_test_meta', 'subscription_canceled');

        $result = $this->callHandleChargeback($dispute);

        $this->assertTrue($result['success']);

        $payment->refresh();
        $metadata = $payment->metadata;

        $this->assertEquals('dp_test_meta', $metadata['chargeback_dispute_id']);
        $this->assertEquals('subscription_canceled', $metadata['chargeback_reason']);
        $this->assertArrayHasKey('chargeback_at', $metadata);
    }
}
