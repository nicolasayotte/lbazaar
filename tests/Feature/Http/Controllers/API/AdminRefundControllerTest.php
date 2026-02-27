<?php

namespace Tests\Feature\Http\Controllers\API;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\StripePayment;
use App\Models\User;
use App\Services\API\CoursePurchaseService;
use App\Services\API\StripeService;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

/**
 * Feature tests for the admin refund endpoints:
 *   POST /api/admin/refunds/stripe/{stripePaymentId}
 *   POST /api/admin/refunds/ada/{courseHistoryId}
 *
 * Services are mocked so no real Stripe API or web3 calls are made.
 */
class AdminRefundControllerTest extends TestCase
{
    protected StripeService $stripeService;
    protected CoursePurchaseService $coursePurchaseService;
    protected User $admin;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;
    protected StripePayment $stripePayment;
    protected CourseHistory $courseHistory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->stripeService = Mockery::mock(StripeService::class);
        $this->coursePurchaseService = Mockery::mock(CoursePurchaseService::class);

        $this->app->instance(StripeService::class, $this->stripeService);
        $this->app->instance(CoursePurchaseService::class, $this->coursePurchaseService);

        $this->disableUserModelEvents();
        $this->setupTestData();
    }

    private function setupTestData(): void
    {
        $this->createRoles(['admin', 'student']);
        $courseType = $this->createCourseType();

        $this->admin = User::factory()->create([
            'email'             => 'admin-refund-test@example.com',
            'custodial_address' => 'addr_test1qzadmin_refund_test',
        ]);
        $this->admin->attachRole('admin');

        $this->student = User::factory()->create([
            'email'             => 'student-refund-test@example.com',
            'custodial_address' => 'addr_test1qzstudent_refund_test',
        ]);
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id'   => $this->admin->id,
            'course_type_id' => $courseType->id,
            'price'          => 5000,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id'   => $this->admin->id,
        ]);

        $this->stripePayment = StripePayment::factory()->create([
            'user_id'                   => $this->student->id,
            'course_id'                 => $this->course->id,
            'stripe_payment_intent_id'  => 'pi_test_adminrefund001',
            'status'                    => 'succeeded',
            'amount'                    => 5000,
        ]);

        $this->courseHistory = CourseHistory::factory()->create([
            'user_id'              => $this->student->id,
            'course_id'            => $this->course->id,
            'course_schedule_id'   => $this->schedule->id,
            'payment_status'       => 'confirmed',
            'payment_tx_hash'      => 'abcdef1234567890',
            'payment_ada_amount'   => 10.5,
            'payment_submitted_at' => now()->subHours(2),
            'payment_confirmed_at' => now()->subHour(),
            'is_cancelled'         => false,
        ]);
    }

    // -------------------------------------------------------------------------
    // POST /api/admin/refunds/stripe/{stripePaymentId}
    // -------------------------------------------------------------------------

    /** Test 1: Stripe refund requires authentication */
    public function test_stripe_refund_requires_authentication(): void
    {
        $response = $this->postJson('/api/admin/refunds/stripe/pi_test_adminrefund001');

        $response->assertStatus(401);
    }

    /** Test 2: Stripe refund requires admin role */
    public function test_stripe_refund_requires_admin_role(): void
    {
        Sanctum::actingAs($this->student);

        $this->stripeService->shouldNotReceive('refund');

        $response = $this->postJson('/api/admin/refunds/stripe/pi_test_adminrefund001');

        $response->assertStatus(403);
        $response->assertJson(['success' => false]);
    }

    /** Test 3: Stripe refund returns 404 for unknown payment intent */
    public function test_stripe_refund_returns_404_for_unknown_payment_intent(): void
    {
        Sanctum::actingAs($this->admin);

        $this->stripeService->shouldNotReceive('refund');

        $response = $this->postJson('/api/admin/refunds/stripe/pi_nonexistent_xyz999');

        $response->assertStatus(404);
    }

    /** Test 4: Stripe refund returns 200 on success */
    public function test_stripe_refund_returns_200_on_success(): void
    {
        Sanctum::actingAs($this->admin);

        $this->stripeService
            ->shouldReceive('refund')
            ->once()
            ->with(
                Mockery::on(fn ($p) => $p->stripe_payment_intent_id === 'pi_test_adminrefund001'),
                ['force' => false]
            )
            ->andReturn(['success' => true, 'message' => 'Payment refunded successfully', 'data' => ['refund_id' => 're_test_001']]);

        $response = $this->postJson('/api/admin/refunds/stripe/pi_test_adminrefund001');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    // -------------------------------------------------------------------------
    // POST /api/admin/refunds/ada/{courseHistoryId}
    // -------------------------------------------------------------------------

    /** Test 5: ADA refund requires authentication */
    public function test_ada_refund_requires_authentication(): void
    {
        $response = $this->postJson("/api/admin/refunds/ada/{$this->courseHistory->id}");

        $response->assertStatus(401);
    }

    /** Test 6: ADA refund requires admin role */
    public function test_ada_refund_requires_admin_role(): void
    {
        Sanctum::actingAs($this->student);

        $this->coursePurchaseService->shouldNotReceive('refundPurchaseTransaction');

        $response = $this->postJson("/api/admin/refunds/ada/{$this->courseHistory->id}");

        $response->assertStatus(403);
        $response->assertJson(['success' => false]);
    }

    /** Test 7: ADA refund returns 404 for unknown course history */
    public function test_ada_refund_returns_404_for_unknown_course_history(): void
    {
        Sanctum::actingAs($this->admin);

        $this->coursePurchaseService->shouldNotReceive('refundPurchaseTransaction');

        $response = $this->postJson('/api/admin/refunds/ada/999999');

        $response->assertStatus(404);
    }

    /** Test 8: ADA refund returns 200 on success */
    public function test_ada_refund_returns_200_on_success(): void
    {
        Sanctum::actingAs($this->admin);

        $this->coursePurchaseService
            ->shouldReceive('refundPurchaseTransaction')
            ->once()
            ->with(
                Mockery::on(fn ($h) => $h->id === $this->courseHistory->id),
                false
            )
            ->andReturn(['success' => true, 'message' => 'ADA refund submitted.', 'data' => ['txId' => 'abc123', 'adaAmount' => '10.5']]);

        $response = $this->postJson("/api/admin/refunds/ada/{$this->courseHistory->id}");

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    /** Test 9: ADA refund returns hasRewards flag without force */
    public function test_ada_refund_returns_has_rewards_flag_without_force(): void
    {
        Sanctum::actingAs($this->admin);

        $this->coursePurchaseService
            ->shouldReceive('refundPurchaseTransaction')
            ->once()
            ->with(
                Mockery::on(fn ($h) => $h->id === $this->courseHistory->id),
                false
            )
            ->andReturn(['success' => false, 'hasRewards' => true, 'message' => 'Student has earned rewards. Use force=true to proceed.']);

        $response = $this->postJson("/api/admin/refunds/ada/{$this->courseHistory->id}");

        $response->assertStatus(400);
        $response->assertJson(['success' => false, 'hasRewards' => true]);
    }
}
