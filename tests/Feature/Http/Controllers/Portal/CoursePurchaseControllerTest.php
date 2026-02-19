<?php

namespace Tests\Feature\Http\Controllers\Portal;

use Tests\TestCase;
use App\Services\API\CoursePurchaseService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\UserWallet;
use Mockery;

class CoursePurchaseControllerTest extends TestCase
{
    protected $purchaseService;
    protected $teacher;
    protected $student;
    protected $course;
    protected $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        // Create and bind mock service to container - this prevents external calls
        $this->purchaseService = Mockery::mock(CoursePurchaseService::class);
        $this->app->instance(CoursePurchaseService::class, $this->purchaseService);

        // Create test data
        $this->setupTestData();
    }

    private function setupTestData()
    {
        // Disable User model events to prevent web3 calls during testing
        $this->disableUserModelEvents();

        // Create roles
        $this->createRoles(['teacher', 'student']);

        // Create teacher with pre-set custodial address to avoid web3 calls
        $this->teacher = User::factory()->create([
            'email' => 'purchase-teacher@example.com',
            'first_name' => 'John',
            'last_name' => 'Teacher',
            'custodial_address' => 'addr_test1qzteacher123mockaddressfortesting'
        ]);
        $this->teacher->attachRole('teacher');

        // Create student with pre-set custodial address to avoid web3 calls
        $this->student = User::factory()->create([
            'email' => 'purchase-student@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'custodial_address' => 'addr_test1qzstudent123mockaddressfortesting'
        ]);
        $this->student->attachRole('student');

        // Create user wallet for student
        UserWallet::factory()->create([
            'user_id' => $this->student->id,
            'points' => 100,
            'stake_key_hash' => 'abc123def456',
            'address' => 'addr_test1qzstudent_wallet_address'
        ]);

        // Create user wallet for teacher
        UserWallet::factory()->create([
            'user_id' => $this->teacher->id,
            'points' => 50,
            'stake_key_hash' => 'teacher_stake_key',
            'address' => 'addr_test1qzteacher_wallet_address'
        ]);

        // Create course
        $this->course = Course::factory()->create([
            'title' => 'Purchase Test Course',
            'professor_id' => $this->teacher->id,
            'price' => 100
        ]);

        // Create course schedule
        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id,
            'start_datetime' => now()->addDays(1),
            'end_datetime' => now()->addDays(1)->addHours(2)
        ]);
    }

    public function test_build_purchase_tx_requires_authentication()
    {
        // Test without authentication should redirect to login
        $response = $this->postJson("/classes/{$this->schedule->id}/build-purchase-tx");

        $response->assertStatus(401);
    }

    public function test_build_purchase_tx_returns_unsigned_transaction()
    {
        // Mock the service to return success with CBOR transaction
        $this->purchaseService
            ->shouldReceive('buildPurchaseTransaction')
            ->once()
            ->with(
                Mockery::on(function($schedule) {
                    return $schedule->id === $this->schedule->id;
                }),
                Mockery::on(function($user) {
                    return $user->id === $this->student->id;
                })
            )
            ->andReturn([
                'success' => true,
                'message' => 'Transaction built successfully',
                'data' => [
                    'cborTx' => '84a400818258200000000000000000000000000000000000000000000000000000000000000000000182825839000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a001e8480a0f5f6',
                    'adaAmount' => 50.0,
                    'teacherAmount' => 40.0,
                    'adminAmount' => 10.0
                ]
            ]);

        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/build-purchase-tx");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Transaction built successfully',
                'data' => [
                    'cborTx' => '84a400818258200000000000000000000000000000000000000000000000000000000000000000000182825839000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a001e8480a0f5f6',
                    'adaAmount' => 50.0
                ]
            ]);
    }

    public function test_user_cannot_purchase_own_course()
    {
        // Teacher trying to purchase their own course should fail authorization
        $response = $this->actingAs($this->teacher)
            ->postJson("/classes/{$this->schedule->id}/build-purchase-tx");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to purchase this course.'
            ]);
    }

    public function test_submit_purchase_tx_requires_authentication()
    {
        // Test without authentication should return 401
        $response = $this->postJson("/classes/{$this->schedule->id}/submit-purchase-tx", [
            'cborSig' => 'test_signature',
            'cborTx' => 'test_transaction'
        ]);

        $response->assertStatus(401);
    }

    public function test_submit_purchase_tx_validates_required_fields()
    {
        // Test with missing cborSig
        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/submit-purchase-tx", [
                'cborTx' => 'test_transaction'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cborSig']);

        // Test with missing cborTx
        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/submit-purchase-tx", [
                'cborSig' => 'test_signature'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cborTx']);

        // Test with both fields missing
        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/submit-purchase-tx", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cborSig', 'cborTx']);
    }

    public function test_submit_purchase_tx_creates_pending_enrollment()
    {
        // Mock the service to return success
        $this->purchaseService
            ->shouldReceive('submitPurchaseTransaction')
            ->once()
            ->with(
                Mockery::on(function($schedule) {
                    return $schedule->id === $this->schedule->id;
                }),
                Mockery::on(function($user) {
                    return $user->id === $this->student->id;
                }),
                'test_signature',
                'test_transaction'
            )
            ->andReturn([
                'success' => true,
                'message' => 'Transaction submitted successfully. Waiting for blockchain confirmation.',
                'data' => [
                    'txId' => 'abc123def456tx',
                    'adaAmount' => 50.0,
                    'courseHistoryId' => 1
                ]
            ]);

        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/submit-purchase-tx", [
                'cborSig' => 'test_signature',
                'cborTx' => 'test_transaction'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Transaction submitted successfully. Waiting for blockchain confirmation.',
                'data' => [
                    'txId' => 'abc123def456tx'
                ]
            ]);
    }

    public function test_user_cannot_purchase_already_booked_course()
    {
        // Create existing course history
        CourseHistory::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id
        ]);

        // Student trying to purchase already booked course should fail authorization
        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/build-purchase-tx");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to purchase this course.'
            ]);
    }

    public function test_build_purchase_tx_handles_service_failure()
    {
        // Mock the service to return failure
        $this->purchaseService
            ->shouldReceive('buildPurchaseTransaction')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'User wallet not connected. Please connect your wallet first.'
            ]);

        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/build-purchase-tx");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'User wallet not connected. Please connect your wallet first.'
            ]);
    }

    public function test_submit_purchase_tx_handles_service_failure()
    {
        // Mock the service to return failure
        $this->purchaseService
            ->shouldReceive('submitPurchaseTransaction')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Failed to submit purchase transaction: Invalid signature'
            ]);

        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/submit-purchase-tx", [
                'cborSig' => 'invalid_signature',
                'cborTx' => 'test_transaction'
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Failed to submit purchase transaction: Invalid signature'
            ]);
    }

    public function test_failed_payment_does_not_block_repurchase()
    {
        // Create a course history with payment_status = 'failed'
        CourseHistory::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'failed',
            'is_cancelled' => false,
        ]);

        // Mock the service to return a result (authorization passes so service is called)
        $this->purchaseService
            ->shouldReceive('buildPurchaseTransaction')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'User wallet not connected. Please connect your wallet first.'
            ]);

        // A failed payment should NOT block the student from retrying
        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/build-purchase-tx");

        // Assert NOT 403 — authorization passes for failed payments
        $response->assertStatus(400);
    }

    public function test_pending_payment_blocks_repurchase()
    {
        // Create a course history with payment_status = 'pending'
        CourseHistory::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status' => 'pending',
            'is_cancelled' => false,
        ]);

        // A pending payment should block the student from purchasing again
        $response = $this->actingAs($this->student)
            ->postJson("/classes/{$this->schedule->id}/build-purchase-tx");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to purchase this course.'
            ]);
    }
}
