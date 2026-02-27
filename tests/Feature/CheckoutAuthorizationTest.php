<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\StripePayment;
use App\Models\CourseHistory;
use App\Services\API\ExchangeRateService;
use Mockery;

class CheckoutAuthorizationTest extends TestCase
{
    protected User $user;
    protected User $otherUser;
    protected Course $course;
    protected StripePayment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock ExchangeRateService to avoid database dependency
        $mockExchangeRateService = Mockery::mock(ExchangeRateService::class);
        $mockExchangeRateService->shouldReceive('addPriceInAdaToCourses')
            ->andReturnUsing(function ($courses) {
                return $courses; // Return the courses unmodified
            });
        $this->app->instance(ExchangeRateService::class, $mockExchangeRateService);

        // Create test users (withoutEvents to avoid Node.js observer)
        $this->user = $this->createTestUser();
        $this->otherUser = $this->createTestUser();

        // Create test course
        $this->course = Course::factory()->create();

        // Create test payment for the main user
        $this->payment = StripePayment::factory()->create([
            'user_id' => $this->user->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_123456',
            'stripe_customer_id' => 'cus_test_123456',
            'amount' => 5000,
            'currency' => 'usd',
            'status' => 'succeeded',
            'metadata' => [
                'course_name' => 'Test Course',
                'student_email' => $this->user->email,
            ],
        ]);
    }

    public function test_user_can_view_own_payment_success_page(): void
    {
        // Arrange: Authenticate as the payment owner
        $this->actingAs($this->user);

        // Act: Access success page with own payment intent
        $response = $this->get(route('checkout.success', [
            'course_id' => $this->course->id,
            'payment_intent' => $this->payment->stripe_payment_intent_id,
        ]));

        // Assert: Success page rendered
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Checkout/Success')
            ->has('payment')
            ->where('course.id', $this->course->id)
        );
    }

    public function test_user_cannot_view_other_users_payment(): void
    {
        // Arrange: Authenticate as different user
        $this->actingAs($this->otherUser);

        // Act: Attempt to access another user's payment record
        $response = $this->get(route('checkout.success', [
            'course_id' => $this->course->id,
            'payment_intent' => $this->payment->stripe_payment_intent_id,
        ]));

        // Assert: 403 Forbidden
        $response->assertStatus(403);
        $response->assertSee('Unauthorized access to payment record');
    }

    public function test_payment_model_hides_sensitive_fields(): void
    {
        // Act: Convert payment to array (as would be sent to frontend)
        $paymentArray = $this->payment->toArray();

        // Assert: Sensitive fields are hidden
        $this->assertArrayNotHasKey('stripe_payment_intent_id', $paymentArray);
        $this->assertArrayNotHasKey('stripe_customer_id', $paymentArray);
        $this->assertArrayNotHasKey('metadata', $paymentArray);

        // Assert: Public fields are still present
        $this->assertArrayHasKey('id', $paymentArray);
        $this->assertArrayHasKey('user_id', $paymentArray);
        $this->assertArrayHasKey('course_id', $paymentArray);
        $this->assertArrayHasKey('amount', $paymentArray);
        $this->assertArrayHasKey('currency', $paymentArray);
        $this->assertArrayHasKey('status', $paymentArray);
    }

    public function test_success_page_works_without_payment_intent(): void
    {
        // Arrange: Authenticate
        $this->actingAs($this->user);

        // Act: Access success page without payment intent (no authorization check needed)
        $response = $this->get(route('checkout.success', [
            'course_id' => $this->course->id,
        ]));

        // Assert: Success page rendered without payment data
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Checkout/Success')
            ->where('payment', null)
            ->where('course.id', $this->course->id)
        );
    }

    public function test_guest_cannot_access_checkout_success(): void
    {
        // Act: Access success page as guest
        $response = $this->get(route('checkout.success', [
            'course_id' => $this->course->id,
            'payment_intent' => $this->payment->stripe_payment_intent_id,
        ]));

        // Assert: Redirected to portal login
        $response->assertRedirect(route('portal.login'));
    }

    public function test_nonexistent_payment_intent_does_not_error(): void
    {
        // Arrange: Authenticate
        $this->actingAs($this->user);

        // Act: Access with non-existent payment intent
        $response = $this->get(route('checkout.success', [
            'course_id' => $this->course->id,
            'payment_intent' => 'pi_nonexistent_123',
        ]));

        // Assert: Success page rendered with null payment (no authorization check on null)
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Checkout/Success')
            ->where('payment', null)
        );
    }

    public function test_payment_belongs_to_correct_user(): void
    {
        // Assert: Payment relationships
        $this->assertEquals($this->user->id, $this->payment->user_id);
        $this->assertEquals($this->user->id, $this->payment->user->id);
        $this->assertInstanceOf(User::class, $this->payment->user);
    }

    public function test_payment_belongs_to_correct_course(): void
    {
        // Assert: Course relationship
        $this->assertEquals($this->course->id, $this->payment->course_id);
        $this->assertEquals($this->course->id, $this->payment->course->id);
        $this->assertInstanceOf(Course::class, $this->payment->course);
    }

    public function test_multiple_users_cannot_access_same_payment(): void
    {
        // Arrange: Create additional users
        $thirdUser = $this->createTestUser();

        // Test 1: Owner can access
        $this->actingAs($this->user);
        $response1 = $this->get(route('checkout.success', [
            'payment_intent' => $this->payment->stripe_payment_intent_id,
        ]));
        $response1->assertStatus(200);

        // Test 2: Other user cannot access
        $this->actingAs($this->otherUser);
        $response2 = $this->get(route('checkout.success', [
            'payment_intent' => $this->payment->stripe_payment_intent_id,
        ]));
        $response2->assertStatus(403);

        // Test 3: Third user cannot access
        $this->actingAs($thirdUser);
        $response3 = $this->get(route('checkout.success', [
            'payment_intent' => $this->payment->stripe_payment_intent_id,
        ]));
        $response3->assertStatus(403);
    }

    public function test_hidden_fields_not_exposed_via_json_serialization(): void
    {
        // Act: Serialize payment to JSON (as Inertia does)
        $jsonPayment = json_encode($this->payment);
        $decodedPayment = json_decode($jsonPayment, true);

        // Assert: Sensitive fields are not in JSON
        $this->assertArrayNotHasKey('stripe_payment_intent_id', $decodedPayment);
        $this->assertArrayNotHasKey('stripe_customer_id', $decodedPayment);
        $this->assertArrayNotHasKey('metadata', $decodedPayment);
    }
}
