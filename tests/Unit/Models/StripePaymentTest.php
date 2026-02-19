<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\StripePayment;
use App\Models\User;
use App\Models\Course;

class StripePaymentTest extends TestCase
{
    protected User $student;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTestData();
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
                'email' => 'payment-test-student@example.com',
                'custodial_address' => 'addr1test_student'
            ]);
        });
        $this->student->attachRole('student');

        // Create course
        $this->course = Course::factory()->create([
            'title' => 'Payment Test Course',
            'professor_id' => $teacher->id,
            'price' => 5000
        ]);
    }

    /**
     * Test that sensitive fields are not serialized to JSON
     * This is critical for Inertia responses to prevent exposing Stripe secrets
     */
    public function test_hidden_fields_not_serialized(): void
    {
        // Arrange: Create StripePayment with sensitive data
        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => 'pi_test_secret_12345',
            'stripe_customer_id' => 'cus_test_secret_67890',
            'amount' => 5000,
            'currency' => 'jpy',
            'status' => 'succeeded',
            'receipt_url' => 'https://stripe.com/receipt/test',
            'metadata' => [
                'course_title' => 'Test Course',
                'student_email' => 'student@example.com',
                'internal_note' => 'This should be hidden'
            ],
        ]);

        // Act: Serialize to JSON (simulates Inertia serialization)
        $jsonString = $payment->toJson();
        $jsonArray = json_decode($jsonString, true);

        // Assert: Verify hidden fields are NOT in JSON
        $this->assertArrayNotHasKey('stripe_payment_intent_id', $jsonArray,
            'stripe_payment_intent_id should be hidden from JSON serialization');
        $this->assertArrayNotHasKey('stripe_customer_id', $jsonArray,
            'stripe_customer_id should be hidden from JSON serialization');
        $this->assertArrayNotHasKey('metadata', $jsonArray,
            'metadata should be hidden from JSON serialization');

        // Assert: Verify public fields ARE present
        $this->assertArrayHasKey('id', $jsonArray);
        $this->assertArrayHasKey('user_id', $jsonArray);
        $this->assertArrayHasKey('course_id', $jsonArray);
        $this->assertArrayHasKey('amount', $jsonArray);
        $this->assertArrayHasKey('currency', $jsonArray);
        $this->assertArrayHasKey('status', $jsonArray);
        $this->assertArrayHasKey('receipt_url', $jsonArray);

        // Assert: Verify public field values are correct
        $this->assertEquals($payment->id, $jsonArray['id']);
        $this->assertEquals($this->student->id, $jsonArray['user_id']);
        $this->assertEquals($this->course->id, $jsonArray['course_id']);
        $this->assertEquals(5000, $jsonArray['amount']);
        $this->assertEquals('jpy', $jsonArray['currency']);
        $this->assertEquals('succeeded', $jsonArray['status']);
        $this->assertEquals('https://stripe.com/receipt/test', $jsonArray['receipt_url']);
    }

    /**
     * Test that hidden fields are still accessible internally
     * Services must be able to read sensitive data for processing
     */
    public function test_hidden_fields_accessible_internally(): void
    {
        // Arrange: Create StripePayment with sensitive data
        $expectedPaymentIntentId = 'pi_test_internal_access_123';
        $expectedCustomerId = 'cus_test_internal_access_456';
        $expectedMetadata = [
            'course_title' => 'Internal Test Course',
            'student_email' => 'internal@example.com',
            'course_schedule_id' => 42,
        ];

        $payment = StripePayment::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'stripe_payment_intent_id' => $expectedPaymentIntentId,
            'stripe_customer_id' => $expectedCustomerId,
            'amount' => 10000,
            'currency' => 'jpy',
            'status' => 'succeeded',
            'metadata' => $expectedMetadata,
        ]);

        // Act & Assert: Verify hidden fields are accessible as properties
        $this->assertEquals($expectedPaymentIntentId, $payment->stripe_payment_intent_id,
            'stripe_payment_intent_id should be accessible internally');
        $this->assertEquals($expectedCustomerId, $payment->stripe_customer_id,
            'stripe_customer_id should be accessible internally');
        $this->assertIsArray($payment->metadata,
            'metadata should be accessible internally as array');
        $this->assertEquals($expectedMetadata, $payment->metadata,
            'metadata array should match expected values');

        // Assert: Verify metadata is cast to array (not JSON string)
        $this->assertArrayHasKey('course_title', $payment->metadata);
        $this->assertArrayHasKey('student_email', $payment->metadata);
        $this->assertArrayHasKey('course_schedule_id', $payment->metadata);
        $this->assertEquals('Internal Test Course', $payment->metadata['course_title']);
        $this->assertEquals('internal@example.com', $payment->metadata['student_email']);
        $this->assertEquals(42, $payment->metadata['course_schedule_id']);
    }
}
