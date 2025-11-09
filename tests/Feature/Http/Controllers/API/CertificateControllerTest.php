<?php

namespace Tests\Feature\Http\Controllers\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Services\API\CertificateService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\UserWallet;
use App\Models\Role;
use Mockery;

class CertificateControllerTest extends TestCase
{
    use DatabaseTransactions;

    protected $certificateService;
    protected $teacher;
    protected $student;
    protected $course;
    protected $schedule;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create and bind mock service to container - this prevents external calls
        $this->certificateService = Mockery::mock(CertificateService::class);
        $this->app->instance(CertificateService::class, $this->certificateService);
        
        // Create test data
        $this->setupTestData();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function setupTestData()
    {
        // Create roles
        Role::firstOrCreate(['name' => 'teacher'], ['display_name' => 'Teacher']);
        Role::firstOrCreate(['name' => 'student'], ['display_name' => 'Student']);

        // Create teacher
        $this->teacher = User::factory()->create([
            'email' => 'teacher@example.com',
            'first_name' => 'John',
            'last_name' => 'Teacher'
        ]);
        $this->teacher->attachRole('teacher');

        // Create student
        $this->student = User::factory()->create([
            'email' => 'student@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Student'
        ]);
        $this->student->attachRole('student');

        // Create user wallet for student
        UserWallet::factory()->create([
            'user_id' => $this->student->id,
            'points' => 100,
            'stake_key_hash' => 'abc123def456'
        ]);

        // Create course
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id,
            'price' => 50
        ]);

        // Create course schedule
        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id,
            'start_datetime' => now(),
            'end_datetime' => now()->addHours(2)
        ]);

        // Create completed course history
        CourseHistory::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);
    }

    public function test_mint_and_airdrop_certificates_requires_authentication()
    {
        // Test without authentication should return 401
        $response = $this->postJson('/api/certificates/mint-and-airdrop', [
            'course_id' => $this->course->id
        ]);

        $response->assertStatus(401);
    }

    public function test_mint_and_airdrop_certificates_validates_required_parameters()
    {
        // Test with missing course_id should return validation errors
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-and-airdrop', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['course_id']);
    }

    public function test_mint_and_airdrop_certificates_rejects_unauthorized_teacher()
    {
        // Create different teacher who doesn't own the course
        $otherTeacher = User::factory()->create();
        $otherTeacher->attachRole('teacher');

        $response = $this->actingAs($otherTeacher)
            ->postJson('/api/certificates/mint-and-airdrop', [
                'course_id' => $this->course->id
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to mint certificates for this course.'
            ]);
    }

    public function test_mint_and_airdrop_certificates_returns_empty_when_no_eligible_students()
    {
        // Create a course with no completed students
        $emptyCourse = Course::factory()->create([
            'title' => 'Empty Course',
            'professor_id' => $this->teacher->id
        ]);

        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-and-airdrop', [
                'course_id' => $emptyCourse->id
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'No eligible students found for certificate minting.'
            ]);
    }

    public function test_mint_and_airdrop_certificates_processes_eligible_students_successfully()
    {
        // Mock the service to return success - this prevents external Node.js calls
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success' => true,
                'transaction_id' => 'tx123abc',
                'wallet_address' => 'addr1test123',
                'message' => null
            ]);

        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-and-airdrop', [
                'course_id' => $this->course->id
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'success_count' => 1,
                    'failure_count' => 0
                ]
            ]);
    }

    public function test_mint_and_airdrop_certificates_handles_service_failures()
    {
        // Mock the service to return failure
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Minting failed'
            ]);

        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-and-airdrop', [
                'course_id' => $this->course->id
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'success_count' => 0,
                    'failure_count' => 1
                ]
            ]);
    }

    public function test_get_course_completion_summary_returns_teacher_courses()
    {
        $response = $this->actingAs($this->teacher)
            ->getJson('/api/certificates/completion-summary');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'course_id',
                        'course_title',
                        'schedules'
                    ]
                ]
            ]);
    }
}