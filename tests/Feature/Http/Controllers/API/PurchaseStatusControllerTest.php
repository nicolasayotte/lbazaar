<?php

namespace Tests\Feature\Http\Controllers\API;

use Tests\TestCase;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use App\Services\API\CoursePurchaseService;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Mockery;

class PurchaseStatusControllerTest extends TestCase
{
    use WithFaker;

    protected User $student;
    protected User $otherUser;
    protected User $teacher;
    protected Course $course;
    protected CourseSchedule $schedule;
    protected CoursePurchaseService $purchaseService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->purchaseService = Mockery::mock(CoursePurchaseService::class);
        $this->app->instance(CoursePurchaseService::class, $this->purchaseService);

        $this->setupTestData();
    }

    private function setupTestData(): void
    {
        $this->disableUserModelEvents();

        $this->createRoles(['teacher', 'student']);

        $this->teacher = $this->createTestUser(['email' => 'psc-teacher@example.com']);
        $this->teacher->attachRole('teacher');

        $this->student = $this->createTestUser(['email' => 'psc-student@example.com']);
        $this->student->attachRole('student');

        $this->otherUser = $this->createTestUser(['email' => 'psc-other@example.com']);
        $this->otherUser->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
            'price' => 5000,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);
    }

    private function makePendingHistory(string $txHash, User $user = null): CourseHistory
    {
        return CourseHistory::create([
            'course_schedule_id'   => $this->schedule->id,
            'course_id'            => $this->course->id,
            'user_id'              => ($user ?? $this->student)->id,
            'payment_status'       => 'pending',
            'payment_tx_hash'      => $txHash,
            'payment_ada_amount'   => 20.0,
            'payment_submitted_at' => now()->subMinutes(5),
        ]);
    }

    // -------------------------------------------------------------------------
    // Authentication
    // -------------------------------------------------------------------------

    public function test_requires_authentication()
    {
        $response = $this->getJson('/api/purchases/some_tx_hash/status');

        $response->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // Not found cases
    // -------------------------------------------------------------------------

    public function test_returns_404_for_unknown_tx_hash()
    {
        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/purchases/nonexistent_hash/status');

        $response->assertStatus(404)
            ->assertJson(['success' => false]);
    }

    public function test_returns_404_for_tx_hash_belonging_to_other_user()
    {
        $this->makePendingHistory('other_users_tx_hash', $this->otherUser);

        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/purchases/other_users_tx_hash/status');

        $response->assertStatus(404)
            ->assertJson(['success' => false]);
    }

    // -------------------------------------------------------------------------
    // DB status short-circuit (no blockchain call)
    // -------------------------------------------------------------------------

    public function test_returns_confirmed_status_from_db_without_blockchain_call()
    {
        CourseHistory::create([
            'course_schedule_id'   => $this->schedule->id,
            'course_id'            => $this->course->id,
            'user_id'              => $this->student->id,
            'payment_status'       => 'confirmed',
            'payment_tx_hash'      => 'confirmed_tx_hash',
            'payment_ada_amount'   => 20.0,
            'payment_submitted_at' => now()->subHours(2),
            'payment_confirmed_at' => now()->subHour(),
        ]);

        // Ensure no blockchain call is made
        $this->purchaseService->shouldNotReceive('getTxStatus');

        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/purchases/confirmed_tx_hash/status');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'confirmed'],
            ]);
    }

    public function test_returns_failed_status_from_db_without_blockchain_call()
    {
        CourseHistory::create([
            'course_schedule_id'   => $this->schedule->id,
            'course_id'            => $this->course->id,
            'user_id'              => $this->student->id,
            'payment_status'       => 'failed',
            'payment_tx_hash'      => 'failed_tx_hash',
            'payment_ada_amount'   => 20.0,
            'payment_submitted_at' => now()->subHours(1),
        ]);

        // Ensure no blockchain call is made
        $this->purchaseService->shouldNotReceive('getTxStatus');

        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/purchases/failed_tx_hash/status');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'failed', 'confirmations' => 0],
            ]);
    }

    // -------------------------------------------------------------------------
    // Live blockchain status (pending in DB)
    // -------------------------------------------------------------------------

    public function test_returns_pending_status_with_confirmation_count()
    {
        $this->makePendingHistory('pending_tx_hash_polling');

        $this->purchaseService->shouldReceive('getTxStatus')
            ->once()
            ->with('pending_tx_hash_polling')
            ->andReturn(['status' => 'pending', 'confirmations' => 4, 'required' => 10]);

        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/purchases/pending_tx_hash_polling/status');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'pending', 'confirmations' => 4, 'required' => 10],
            ]);
    }

    public function test_confirms_purchase_when_blockchain_returns_confirmed()
    {
        $this->makePendingHistory('newly_confirmed_tx');

        $this->purchaseService->shouldReceive('getTxStatus')
            ->once()
            ->with('newly_confirmed_tx')
            ->andReturn(['status' => 'confirmed', 'confirmations' => 10, 'required' => 10]);

        $this->purchaseService->shouldReceive('confirmPurchaseTransaction')
            ->once()
            ->with('newly_confirmed_tx')
            ->andReturn(['success' => true, 'message' => 'Purchase confirmed successfully']);

        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/purchases/newly_confirmed_tx/status');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'confirmed'],
            ]);
    }
}
