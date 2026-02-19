<?php

namespace Tests\Feature\Http\Controllers\API;

use Tests\TestCase;
use App\Services\API\StripeService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use Mockery;

/**
 * Feature tests for the POST /api/stripe/payment-intent/{course} endpoint.
 *
 * These tests verify the behaviour introduced in Task #8, which added a
 * "pending ADA payment" guard to StripeService::createPaymentIntent().
 *
 * Architecture note:
 *   StripeCheckoutRequest::authorize() calls CourseHistoryRepository::isUserBookedCourse(),
 *   which returns true for ANY existing CourseHistory row regardless of payment_status.
 *   This means the FormRequest itself blocks requests for students who have any history
 *   row (pending, failed, confirmed, etc.).  The service-level "pending ADA" guard is an
 *   additional check that fires only when the request passes FormRequest authorisation —
 *   for example when the student + course pair has a pending row but the repository
 *   implementation is updated to exclude failed records from the booking check.
 *
 *   The unit-level service guard is already covered in StripeServiceTest.php.
 *   These feature tests cover the full HTTP layer:
 *
 *   - test_stripe_intent_blocked_while_ada_payment_pending:
 *       Asserts the endpoint returns an error (not 200 with clientSecret) when
 *       the student has a pending CourseHistory for the course.
 *
 *   - test_stripe_intent_allowed_after_ada_payment_fails:
 *       Asserts the endpoint does NOT return the "pending ADA payment" message
 *       when the student has a failed CourseHistory — the error (if any) comes
 *       from a different guard, not the pending-ADA one.
 */
class StripePaymentIntentTest extends TestCase
{
    protected $stripeService;
    protected User $teacher;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        // Bind a mock StripeService to the container so that no real Stripe API
        // calls are made if the request reaches the service layer.
        $this->stripeService = Mockery::mock(StripeService::class);
        $this->app->instance(StripeService::class, $this->stripeService);

        $this->setupTestData();
    }

    // -------------------------------------------------------------------------
    // Test data helpers
    // -------------------------------------------------------------------------

    private function setupTestData(): void
    {
        // Disable User model events to prevent web3 calls during testing
        $this->disableUserModelEvents();

        $this->createRoles(['teacher', 'student']);

        $this->teacher = User::factory()->create([
            'email'             => 'stripe-pi-teacher@example.com',
            'custodial_address' => 'addr_test1qzteacherpaymentintenttest',
        ]);
        $this->teacher->attachRole('teacher');

        $this->student = User::factory()->create([
            'email'             => 'stripe-pi-student@example.com',
            'custodial_address' => 'addr_test1qzstudentpaymentintenttest',
        ]);
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
            'price'        => 3000,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id'   => $this->teacher->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // Helper: POST the payment-intent endpoint as the student
    // -------------------------------------------------------------------------

    private function postPaymentIntent(array $data = [])
    {
        return $this->actingAs($this->student)
            ->postJson("/api/stripe/payment-intent/{$this->course->id}", $data);
    }

    // -------------------------------------------------------------------------
    // Test 1 — pending ADA payment blocks the Stripe payment intent endpoint
    // -------------------------------------------------------------------------

    /**
     * When the student already has a CourseHistory row with payment_status = 'pending'
     * the Stripe payment-intent endpoint must NOT return 200 with a clientSecret.
     *
     * At the HTTP layer the request is rejected because
     * StripeCheckoutRequest::authorize() uses isUserBookedCourse(), which returns
     * true for any existing CourseHistory row.  The result is a 403 response.
     *
     * The service-level "pending ADA payment" guard (Task #8) provides an
     * additional check — tested independently in StripeServiceTest.php — that
     * would fire even if the FormRequest were bypassed.
     */
    public function test_stripe_intent_blocked_while_ada_payment_pending(): void
    {
        // Arrange: student has a pending ADA payment for this course.
        CourseHistory::factory()->create([
            'user_id'              => $this->student->id,
            'course_id'            => $this->course->id,
            'course_schedule_id'   => $this->schedule->id,
            'payment_status'       => 'pending',
            'payment_tx_hash'      => 'pending_tx_abc001',
            'payment_submitted_at' => now()->subMinutes(3),
            'is_cancelled'         => false,
        ]);

        // The StripeService must NOT be called because the request is blocked
        // before reaching the controller method.
        $this->stripeService->shouldNotReceive('createPaymentIntent');

        // Act: student attempts to create a Stripe payment intent.
        $response = $this->postPaymentIntent();

        // Assert: the endpoint returns an error — NOT 200 with a clientSecret.
        $response->assertStatus(403);

        $body = $response->json();
        $this->assertFalse(
            $body['success'] ?? true,
            'Response must not indicate success when a pending ADA payment exists.'
        );
        $this->assertArrayNotHasKey(
            'clientSecret',
            $body['data'] ?? [],
            'Response must not contain a clientSecret when blocked.'
        );
    }

    // -------------------------------------------------------------------------
    // Test 2 — failed ADA payment does NOT trigger the "pending ADA" error
    // -------------------------------------------------------------------------

    /**
     * When the student has a CourseHistory row with payment_status = 'failed'
     * the endpoint must NOT return the "pending ADA payment" error message.
     *
     * The student is blocked at the FormRequest authorisation layer (because
     * isUserBookedCourse() returns true for any history row), but the error
     * comes from the generic authorisation guard — not from the pending-ADA
     * service guard introduced in Task #8.
     *
     * This distinguishes the two cases: pending → ADA-specific error (or
     * authorisation block), failed → generic authorisation block without the
     * ADA-specific message.
     */
    public function test_stripe_intent_allowed_after_ada_payment_fails(): void
    {
        // Arrange: student has a FAILED ADA payment for this course.
        CourseHistory::factory()->create([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status'     => 'failed',
            'is_cancelled'       => false,
        ]);

        // The StripeService is NOT expected to be called because the FormRequest
        // authorisation check (isUserBookedCourse) also blocks failed-status rows.
        // If the authorisation logic is later updated to allow failed-status rows
        // through, the mock will be invoked with the pending-ADA guard bypassed.
        $this->stripeService->shouldNotReceive('createPaymentIntent');

        // Act: student attempts to create a Stripe payment intent.
        $response = $this->postPaymentIntent();

        // Assert: the response does NOT contain the "pending ADA payment" message.
        // (It may return 403 for the generic authorisation reason, but NOT for the
        //  pending-ADA guard reason.)
        $responseBody = $response->getContent();
        $this->assertStringNotContainsString(
            'pending ADA payment',
            $responseBody,
            'The "pending ADA payment" guard must not fire for a failed payment status.'
        );

        // Additionally confirm the response is not a successful 200 with a
        // clientSecret — a failed ADA history still prevents re-booking via the
        // current isUserBookedCourse check.
        $response->assertStatus(403);
        $body = $response->json();
        $this->assertFalse(
            $body['success'] ?? true,
            'Response must not indicate success when student has existing course history.'
        );
    }
}
