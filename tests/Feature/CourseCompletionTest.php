<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\CourseHistory;
use App\Services\API\CertificateService;
use App\Services\API\TokenRewardService;
use Mockery;

class CourseCompletionTest extends TestCase
{
    protected $teacher;
    protected $student;
    protected $course;
    protected $schedule;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTestData();
    }

    private function setupTestData()
    {
        // Create roles
        $this->createRoles(['teacher', 'student']);

        // Create teacher
        $this->teacher = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'John',
                'last_name' => 'Teacher'
            ]);
        });
        $this->teacher->attachRole('teacher');

        // Create student
        $this->student = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'Jane',
                'last_name' => 'Student'
            ]);
        });
        $this->student->attachRole('student');

        // Create course
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);

        // Create schedule
        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);
    }

    public function test_complete_confirmation_redirects_when_not_booked()
    {
        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]));

        $response->assertRedirect(route('course.details', ['id' => $this->course->id]));
    }

    public function test_complete_confirmation_shows_page_when_booked()
    {
        // Create booking
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => null
        ]);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/CourseCompleteConfirmation')
            ->has('course')
            ->has('schedule')
        );
    }

    public function test_complete_confirmation_returns_null_certificate_when_not_enabled()
    {
        // Create course without certificate enabled
        $courseNoCert = Course::factory()->create([
            'title' => 'No Certificate Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => false
        ]);

        $scheduleNoCert = CourseSchedule::factory()->create([
            'course_id' => $courseNoCert->id
        ]);

        // Create booking
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $courseNoCert->id,
            'course_schedule_id' => $scheduleNoCert->id,
            'completed_at' => now()
        ]);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $courseNoCert->id,
            'schedule_id' => $scheduleNoCert->id
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/CourseCompleteConfirmation')
            ->where('certificate', null)
        );
    }

    public function test_complete_confirmation_returns_certificate_data_when_completed()
    {
        // Create completed booking with minted certificate
        $txHash = 'test_tx_hash_123';
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(1),
            'certificate_status' => 'minted',
            'certificate_tx_hash' => $txHash,
            'certificate_minted_at' => now()->subHours(12)
        ]);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/CourseCompleteConfirmation')
            ->has('certificate')
            ->where('certificate.status', 'minted')
            ->where('certificate.tx_hash', $txHash)
            ->has('certificate.explorer_url')
            ->has('certificate.minted_at')
        );
    }

    public function test_complete_confirmation_uses_certificate_service()
    {
        // Create completed booking
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(1),
            'certificate_status' => 'not_eligible'
        ]);

        // Mock the CertificateService — controller now calls getSelfMintEligibility
        $mockService = Mockery::mock(CertificateService::class);
        $mockService->shouldReceive('getSelfMintEligibility')
            ->once()
            ->with($this->course->id, $this->student->id, $this->schedule->id)
            ->andReturn([
                'certificate' => [
                    'status'       => 'not_eligible',
                    'tx_hash'      => null,
                    'explorer_url' => null,
                    'minted_at'    => null,
                    'fee_lovelace' => 2500000,
                ],
                'token'              => null,
                'total_fee_lovelace' => 2500000,
            ]);

        $this->app->instance(CertificateService::class, $mockService);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]));

        $response->assertStatus(200);
    }

    public function test_complete_confirmation_includes_rewards_and_wallet_flag()
    {
        // Create completed booking with certificate
        CourseHistory::create([
            'user_id'               => $this->student->id,
            'course_id'             => $this->course->id,
            'course_schedule_id'    => $this->schedule->id,
            'completed_at'          => now()->subDays(1),
            'certificate_status'    => 'not_eligible',
            'enrolled_certificate_enabled' => true,
        ]);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id'   => $this->course->id,
            'schedule_id' => $this->schedule->id,
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/CourseCompleteConfirmation')
            ->has('rewards')
            ->has('has_external_wallet')
            ->has('certificate')  // legacy prop must still be present
        );
    }

    public function test_complete_confirmation_explorer_url_uses_config()
    {
        // Create completed booking with minted certificate
        $txHash = 'config_test_tx_hash';
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(1),
            'certificate_status' => 'minted',
            'certificate_tx_hash' => $txHash,
            'certificate_minted_at' => now()->subHours(6)
        ]);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]));

        // Get expected URL from config
        $expectedBaseUrl = config('services.cardano.explorer_url');
        $expectedUrl = $expectedBaseUrl . '/tx/' . $txHash;

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('certificate.explorer_url', $expectedUrl)
        );
    }

    public function test_complete_confirmation_returns_pending_status()
    {
        // Create completed booking with pending certificate
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subHours(1),
            'certificate_status' => 'pending'
        ]);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('certificate.status', 'pending')
            ->where('certificate.tx_hash', null)
            ->where('certificate.explorer_url', null)
        );
    }

    public function test_complete_confirmation_returns_failed_status()
    {
        // Create completed booking with failed certificate
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subHours(1),
            'certificate_status' => 'failed'
        ]);

        $this->actingAs($this->student);

        $response = $this->get(route('course.attend.complete.confirmation', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('certificate.status', 'failed')
        );
    }

    public function test_student_self_mint_certificate_succeeds()
    {
        // Create completed booking with certificate enabled
        CourseHistory::create([
            'user_id'                      => $this->student->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $this->schedule->id,
            'completed_at'                 => now()->subDays(1),
            'certificate_status'           => 'not_eligible',
            'enrolled_certificate_enabled' => true,
        ]);

        // Mock CertificateService
        $mockCertService = Mockery::mock(CertificateService::class);
        $mockCertService->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success'        => true,
                'message'        => 'Certificate minted and airdropped successfully',
                'transaction_id' => 'mock_cert_tx_hash_123',
                'wallet_address' => 'addr1mock',
            ]);

        $this->app->instance(CertificateService::class, $mockCertService);

        $this->actingAs($this->student);

        $response = $this->postJson(route('course.attend.self.mint', [
            'course_id'   => $this->course->id,
            'schedule_id' => $this->schedule->id,
        ]), ['type' => 'certificate']);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'success' => true,
            'tx_hash' => 'mock_cert_tx_hash_123',
        ]);
    }

    public function test_student_self_mint_blocked_when_already_minted()
    {
        // Create completed booking with certificate already minted
        CourseHistory::create([
            'user_id'                      => $this->student->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $this->schedule->id,
            'completed_at'                 => now()->subDays(1),
            'certificate_status'           => 'minted',
            'certificate_tx_hash'          => 'existing_tx_hash',
            'enrolled_certificate_enabled' => true,
        ]);

        $this->actingAs($this->student);

        $response = $this->postJson(route('course.attend.self.mint', [
            'course_id'   => $this->course->id,
            'schedule_id' => $this->schedule->id,
        ]), ['type' => 'certificate']);

        $response->assertStatus(409);
        $response->assertJsonFragment([
            'success'        => false,
            'already_minted' => true,
        ]);
    }

    public function test_student_self_mint_requires_completed_course()
    {
        // Create booking WITHOUT completed_at
        CourseHistory::create([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at'       => null,
        ]);

        $this->actingAs($this->student);

        $response = $this->postJson(route('course.attend.self.mint', [
            'course_id'   => $this->course->id,
            'schedule_id' => $this->schedule->id,
        ]), ['type' => 'certificate']);

        $response->assertStatus(404);
    }

    public function test_student_self_mint_validates_type_field()
    {
        $this->actingAs($this->student);

        $response = $this->postJson(route('course.attend.self.mint', [
            'course_id'   => $this->course->id,
            'schedule_id' => $this->schedule->id,
        ]), ['type' => 'invalid_type']);

        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
    }
}
