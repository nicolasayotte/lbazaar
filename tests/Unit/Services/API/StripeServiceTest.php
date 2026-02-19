<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Services\API\StripeService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\StripePayment;
use Illuminate\Support\Facades\DB;
use Mockery;
use stdClass;

class StripeServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected StripeService $service;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setupTestData();
        $this->service = new StripeService();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function setupTestData()
    {
        // Create roles
        $this->createRoles(['student', 'teacher']);

        // Create teacher
        $teacher = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'John',
                'last_name' => 'Teacher',
                'custodial_address' => 'addr1test_teacher'
            ]);
        });
        $teacher->attachRole('teacher');

        // Create student
        $this->student = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'Jane',
                'last_name' => 'Student',
                'email' => 'stripe-student@example.com',
                'custodial_address' => 'addr1test_student'
            ]);
        });
        $this->student->attachRole('student');

        // Create course with price
        $this->course = Course::factory()->create([
            'title' => 'Stripe Test Course',
            'professor_id' => $teacher->id,
            'price' => 1000
        ]);

        // Create schedule
        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);
    }

    /**
     * Test that course with zero price is rejected
     */
    public function test_rejects_zero_price_course(): void
    {
        // Arrange: Create course with price 0
        $zeroPriceCourse = Course::factory()->create([
            'title' => 'Free Course',
            'professor_id' => $this->course->professor_id,
            'price' => 0
        ]);

        // Act: Try to create payment intent
        $result = $this->service->createPaymentIntent($zeroPriceCourse, $this->student->id);

        // Assert: Should fail
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Invalid payment amount', $result['message']);
    }

    /**
     * Test that createPaymentIntent is blocked when a pending ADA payment exists
     */
    public function test_blocks_stripe_payment_when_pending_ada_payment_exists(): void
    {
        // Arrange: Create a pending ADA CourseHistory record for the student and course
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'is_cancelled' => false,
            'payment_status' => 'pending',
        ]);

        // Act: Attempt to create a Stripe PaymentIntent
        $result = $this->service->createPaymentIntent($this->course, $this->student->id);

        // Assert: Should fail with the ADA pending message
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('pending ADA payment', $result['message']);
    }

    /**
     * Test that createPaymentIntent proceeds when no pending ADA payment exists
     */
    public function test_does_not_block_stripe_payment_when_no_pending_ada_payment(): void
    {
        // Arrange: Create a confirmed (non-pending) ADA CourseHistory record
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'is_cancelled' => false,
            'payment_status' => 'confirmed',
        ]);

        // Act: Attempt to create a Stripe PaymentIntent
        // This will fail at the Stripe API call (no real API key), but it must NOT
        // return the ADA-pending error — it must reach the Stripe SDK call.
        $result = $this->service->createPaymentIntent($this->course, $this->student->id);

        // Assert: Must not be the ADA pending block message
        $this->assertStringNotContainsString('pending ADA payment', $result['message']);
    }

    /**
     * Test successful payment handling creates enrollment
     */
    public function test_handles_payment_success_creates_enrollment(): void
    {
        // Arrange: Create a pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_success_123',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_schedule_id' => $this->schedule->id,
                'course_title' => $this->course->title,
            ],
        ]);

        // Mock PaymentIntent object
        $paymentIntent = (object) [
            'id' => 'pi_test_success_123',
            'charges' => (object) [
                'data' => [(object) ['receipt_url' => 'https://stripe.com/receipt/test123']]
            ],
        ];

        // Act: Handle payment success using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentSuccess');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Verify response
        $this->assertTrue($result['success']);
        $this->assertEquals('Payment processed successfully', $result['message']);
        $this->assertArrayHasKey('course_history_id', $result['data']);

        // Verify payment status changed to 'succeeded'
        $payment->refresh();
        $this->assertEquals('succeeded', $payment->status);
        $this->assertNotNull($payment->course_history_id);
        $this->assertEquals('https://stripe.com/receipt/test123', $payment->receipt_url);

        // Verify CourseHistory record was created
        $courseHistory = CourseHistory::find($payment->course_history_id);
        $this->assertNotNull($courseHistory);
        $this->assertEquals($this->student->id, $courseHistory->user_id);
        $this->assertEquals($this->course->id, $courseHistory->course_id);
        $this->assertEquals(0, $courseHistory->is_cancelled);
    }

    /**
     * Test payment failure handling
     */
    public function test_handles_payment_failure(): void
    {
        // Arrange: Create a pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_failure_123',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_title' => $this->course->title,
            ],
        ]);

        // Mock PaymentIntent object with failure reason
        $paymentIntent = (object) [
            'id' => 'pi_test_failure_123',
            'last_payment_error' => (object) [
                'message' => 'Insufficient funds'
            ],
        ];

        // Act: Handle payment failure using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentFailure');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Verify response
        $this->assertTrue($result['success']);
        $this->assertEquals('Payment failure recorded', $result['message']);
        $this->assertArrayHasKey('failure_reason', $result['data']);

        // Verify payment status changed to 'failed'
        $payment->refresh();
        $this->assertEquals('failed', $payment->status);
        $this->assertEquals('Insufficient funds', $payment->metadata['failure_reason']);
    }

    /**
     * Test duplicate payment success handling (idempotency)
     */
    public function test_prevents_duplicate_enrollment_on_success(): void
    {
        // Arrange: Create a pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_duplicate_123',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_schedule_id' => $this->schedule->id,
                'course_title' => $this->course->title,
            ],
        ]);

        $paymentIntent = (object) [
            'id' => 'pi_test_duplicate_123',
            'charges' => (object) [
                'data' => [(object) ['receipt_url' => 'https://stripe.com/receipt/dup123']]
            ],
        ];

        // Act: Process payment first time using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentSuccess');
        $method->setAccessible(true);
        $result1 = $method->invoke($this->service, $paymentIntent);
        $this->assertTrue($result1['success']);

        // Act: Try to process again (simulating duplicate webhook)
        $result2 = $method->invoke($this->service, $paymentIntent);

        // Assert: Second call should succeed but not create duplicate
        $this->assertTrue($result2['success']);
        $this->assertEquals('Payment already processed', $result2['message']);

        // Verify only one CourseHistory record exists
        $courseHistoryCount = CourseHistory::where('user_id', $this->student->id)
            ->where('course_id', $this->course->id)
            ->count();
        $this->assertEquals(1, $courseHistoryCount);
    }

    /**
     * Test refund rejects non-succeeded payments
     */
    public function test_cannot_refund_non_succeeded_payment(): void
    {
        // Arrange: Create a pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_pending_refund',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [],
        ]);

        // Act: Try to refund pending payment
        $result = $this->service->refund($payment);

        // Assert: Should fail
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Only succeeded payments can be refunded', $result['message']);
        $this->assertStringContainsString('pending', $result['message']);
    }

    /**
     * Test refund updates database atomically on successful Stripe call
     *
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function test_refund_updates_database_atomically(): void
    {
        // Arrange: Create a succeeded payment with enrollment
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'is_cancelled' => false,
        ]);

        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_refund_atomic_123',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'succeeded',
            'course_history_id' => $courseHistory->id,
            'metadata' => [
                'course_schedule_id' => $this->schedule->id,
                'course_title' => $this->course->title,
            ],
        ]);

        // Mock Stripe Refund::create to return successful refund
        $mockRefund = Mockery::mock('overload:Stripe\Refund');
        $mockRefund->shouldReceive('create')
            ->once()
            ->with([
                'payment_intent' => 'pi_test_refund_atomic_123',
            ])
            ->andReturn((object) ['id' => 're_test_atomic_123']);

        // Act: Refund the payment
        $result = $this->service->refund($payment);

        // Assert: Verify successful response
        $this->assertTrue($result['success'], 'Refund should succeed');
        $this->assertEquals('Payment refunded successfully', $result['message']);
        $this->assertEquals('re_test_atomic_123', $result['data']['refund_id']);

        // Verify database updates happened atomically
        $payment->refresh();
        $this->assertEquals('refunded', $payment->status);
        $this->assertEquals('re_test_atomic_123', $payment->metadata['refund_id']);
        $this->assertNotNull($payment->metadata['refunded_at']);

        // Verify enrollment was cancelled
        $courseHistory->refresh();
        $this->assertTrue((bool) $courseHistory->is_cancelled, 'Enrollment should be cancelled');
    }

    /**
     * Test refund rolls back database changes when Stripe API fails
     *
     * Note: This test relies on actual Stripe API error (authentication failure)
     * to demonstrate transaction rollback. The key behavior being tested is that
     * when Stripe API call fails inside the transaction, ALL database changes
     * are rolled back atomically.
     */
    public function test_refund_rolls_back_on_stripe_failure(): void
    {
        // Arrange: Create a succeeded payment with enrollment
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'is_cancelled' => false,
        ]);

        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_will_fail',
            'stripe_customer_id' => 'cus_test_456',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'succeeded',
            'course_history_id' => $courseHistory->id,
            'metadata' => [
                'course_title' => $this->course->title,
            ],
        ]);

        // Record original state
        $originalPaymentStatus = $payment->status;
        $originalCancellationStatus = $courseHistory->is_cancelled;

        // Act: Try to refund - will fail because Stripe API key is not configured
        // This demonstrates that when Stripe API fails, DB changes are rolled back
        $result = $this->service->refund($payment);

        // Assert: Verify failure response (will fail with authentication or API error)
        $this->assertFalse($result['success'], 'Refund should fail when Stripe API fails');

        // The key assertion: Verify database was NOT modified (transaction rolled back)
        $payment->refresh();
        $this->assertEquals($originalPaymentStatus, $payment->status, 'Payment status should remain unchanged after rollback');
        $this->assertArrayNotHasKey('refund_id', $payment->metadata ?? [], 'refund_id should not be in metadata after rollback');

        // Verify enrollment was NOT cancelled (critical for data integrity)
        $courseHistory->refresh();
        $this->assertEquals($originalCancellationStatus, $courseHistory->is_cancelled, 'Enrollment cancellation should be rolled back');
    }

    /**
     * Test payment success stores receipt URL
     */
    public function test_handles_payment_success_with_receipt_url(): void
    {
        // Arrange: Create pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_receipt_123',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_schedule_id' => $this->schedule->id,
            ],
        ]);

        // Mock PaymentIntent with receipt URL
        $expectedReceiptUrl = 'https://stripe.com/receipt/detailed_receipt_url_123';
        $paymentIntent = (object) [
            'id' => 'pi_test_receipt_123',
            'charges' => (object) [
                'data' => [
                    (object) [
                        'receipt_url' => $expectedReceiptUrl
                    ]
                ]
            ],
        ];

        // Act: Handle payment success using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentSuccess');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Verify receipt URL stored
        $this->assertTrue($result['success']);
        $payment->refresh();
        $this->assertEquals($expectedReceiptUrl, $payment->receipt_url);
    }

    /**
     * Test payment success without receipt URL (edge case)
     */
    public function test_handles_payment_success_without_receipt_url(): void
    {
        // Arrange: Create pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_no_receipt',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_schedule_id' => $this->schedule->id,
            ],
        ]);

        // Mock PaymentIntent without charges data
        $paymentIntent = (object) [
            'id' => 'pi_test_no_receipt',
            'charges' => (object) [
                'data' => []
            ],
        ];

        // Act: Handle payment success using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentSuccess');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Should still succeed
        $this->assertTrue($result['success']);
        $payment->refresh();
        $this->assertNull($payment->receipt_url);
    }

    /**
     * Test createPaymentIntent API call (should be skipped without Stripe keys)
     */
    public function test_create_payment_intent_requires_stripe_keys(): void
    {
        $this->markTestSkipped('Requires Stripe test keys configured in environment');

        // This test would call the actual Stripe API
        // $result = $this->service->createPaymentIntent($this->course, $this->student->id);
        // $this->assertTrue($result['success']);
        // $this->assertArrayHasKey('client_secret', $result['data']);
    }

    /**
     * Test refund API call (should be skipped without Stripe keys)
     */
    public function test_refund_requires_stripe_keys(): void
    {
        $this->markTestSkipped('Requires Stripe test keys configured in environment');

        // This test would call the actual Stripe API
        // Create succeeded payment first
        // $payment = StripePayment::create([...]);
        // $result = $this->service->refund($payment);
        // $this->assertTrue($result['success']);
    }

    /**
     * Test handlePaymentFailure with missing payment record
     */
    public function test_handles_payment_failure_with_missing_record(): void
    {
        // Arrange: Mock PaymentIntent for non-existent payment
        $paymentIntent = (object) [
            'id' => 'pi_test_nonexistent',
            'last_payment_error' => (object) [
                'message' => 'Card declined'
            ],
        ];

        // Act: Try to handle failure using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentFailure');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Should report not found
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Payment record not found', $result['message']);
    }

    /**
     * Test payment success with course_schedule_id in metadata
     */
    public function test_handles_payment_success_with_schedule_id(): void
    {
        // Arrange: Create payment with schedule_id in metadata
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_schedule_123',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_schedule_id' => 42,
                'course_title' => $this->course->title,
            ],
        ]);

        $paymentIntent = (object) [
            'id' => 'pi_test_schedule_123',
            'charges' => (object) [
                'data' => [(object) ['receipt_url' => 'https://stripe.com/receipt/schedule']]
            ],
        ];

        // Act: Handle payment success using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentSuccess');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Verify CourseHistory has schedule_id
        $this->assertTrue($result['success']);
        $courseHistory = CourseHistory::find($result['data']['course_history_id']);
        $this->assertNotNull($courseHistory);
        $this->assertEquals(42, $courseHistory->course_schedule_id);
    }

    /**
     * Test idempotency key generation creates consistent hashes
     */
    public function test_generates_idempotency_key(): void
    {
        // Arrange: Use reflection to access protected method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('generateIdempotencyKey');
        $method->setAccessible(true);

        // Act: Generate key
        $key = $method->invoke($this->service, 123, 456);

        // Assert: Key is a valid SHA-256 hash (64 hex characters)
        $this->assertIsString($key);
        $this->assertEquals(64, strlen($key));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $key);
    }

    /**
     * Test idempotency keys are consistent within same time window
     */
    public function test_idempotency_key_consistent_within_time_window(): void
    {
        // Arrange: Use reflection to access protected method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('generateIdempotencyKey');
        $method->setAccessible(true);

        // Act: Generate keys for same user/course multiple times
        $key1 = $method->invoke($this->service, 123, 456);
        $key2 = $method->invoke($this->service, 123, 456);
        $key3 = $method->invoke($this->service, 123, 456);

        // Assert: All keys should be identical within same 5-minute window
        $this->assertEquals($key1, $key2);
        $this->assertEquals($key2, $key3);
    }

    /**
     * Test idempotency keys are unique across different courses
     */
    public function test_idempotency_key_unique_across_courses(): void
    {
        // Arrange: Use reflection to access protected method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('generateIdempotencyKey');
        $method->setAccessible(true);

        // Act: Generate keys for same user but different courses
        $keyCourse1 = $method->invoke($this->service, 123, 456);
        $keyCourse2 = $method->invoke($this->service, 123, 789);

        // Assert: Keys should be different
        $this->assertNotEquals($keyCourse1, $keyCourse2);
    }

    /**
     * Test idempotency keys are unique across different users
     */
    public function test_idempotency_key_unique_across_users(): void
    {
        // Arrange: Use reflection to access protected method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('generateIdempotencyKey');
        $method->setAccessible(true);

        // Act: Generate keys for different users but same course
        $keyUser1 = $method->invoke($this->service, 123, 456);
        $keyUser2 = $method->invoke($this->service, 789, 456);

        // Assert: Keys should be different
        $this->assertNotEquals($keyUser1, $keyUser2);
    }

    /**
     * Test handles payment_intent.canceled webhook
     */
    public function test_handles_payment_canceled(): void
    {
        // Arrange: Create a pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_canceled_123',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_title' => $this->course->title,
            ],
        ]);

        // Mock PaymentIntent object with cancellation reason
        $paymentIntent = (object) [
            'id' => 'pi_test_canceled_123',
            'cancellation_reason' => 'abandoned',
        ];

        // Act: Handle payment cancellation using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentCanceled');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Verify response
        $this->assertTrue($result['success']);
        $this->assertEquals('Payment cancellation recorded', $result['message']);
        $this->assertArrayHasKey('payment_id', $result['data']);
        $this->assertArrayHasKey('status', $result['data']);

        // Verify payment status changed to 'canceled'
        $payment->refresh();
        $this->assertEquals('canceled', $payment->status);
        $this->assertEquals('abandoned', $payment->metadata['cancellation_reason']);
        $this->assertNotNull($payment->metadata['canceled_at']);
    }

    /**
     * Test handles duplicate payment_intent.canceled webhook (idempotency)
     */
    public function test_handles_duplicate_payment_canceled(): void
    {
        // Arrange: Create a pending payment
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_dup_canceled',
            'stripe_customer_id' => 'cus_test_123',
            'amount' => 1000,
            'currency' => 'jpy',
            'status' => 'pending',
            'metadata' => [
                'course_title' => $this->course->title,
            ],
        ]);

        $paymentIntent = (object) [
            'id' => 'pi_test_dup_canceled',
            'cancellation_reason' => 'requested_by_customer',
        ];

        // Act: Process cancellation first time using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentCanceled');
        $method->setAccessible(true);
        $result1 = $method->invoke($this->service, $paymentIntent);
        $this->assertTrue($result1['success']);

        // Verify status is canceled
        $payment->refresh();
        $this->assertEquals('canceled', $payment->status);
        $originalCanceledAt = $payment->metadata['canceled_at'];

        // Act: Try to process again (simulating duplicate webhook)
        $result2 = $method->invoke($this->service, $paymentIntent);

        // Assert: Second call should succeed but not update again
        $this->assertTrue($result2['success']);
        $this->assertEquals('Payment cancellation recorded', $result2['message']);
        $this->assertEquals('canceled', $result2['data']['status']);

        // Verify payment metadata wasn't changed on duplicate call
        $payment->refresh();
        $this->assertEquals('canceled', $payment->status);
        $this->assertEquals($originalCanceledAt, $payment->metadata['canceled_at']);
    }

    /**
     * Test handles payment_intent.canceled with missing payment record
     */
    public function test_handles_canceled_with_missing_record(): void
    {
        // Arrange: Mock PaymentIntent for non-existent payment
        $paymentIntent = (object) [
            'id' => 'pi_test_nonexistent_canceled',
            'cancellation_reason' => 'duplicate',
        ];

        // Act: Try to handle cancellation using reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('handlePaymentCanceled');
        $method->setAccessible(true);
        $result = $method->invoke($this->service, $paymentIntent);

        // Assert: Should report not found
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Payment record not found', $result['message']);
    }

    public function test_is_available_returns_true_when_secret_configured(): void
    {
        config(['services.stripe.secret' => 'sk_test_fake']);
        $this->assertTrue($this->service->isAvailable());
    }

    public function test_is_available_returns_false_when_secret_empty(): void
    {
        config(['services.stripe.secret' => '']);
        $this->assertFalse($this->service->isAvailable());
    }
}
