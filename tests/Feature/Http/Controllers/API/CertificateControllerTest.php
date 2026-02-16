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
        // Disable User model events to prevent web3 calls during testing
        User::flushEventListeners();
        User::boot();

        // Create roles
        Role::firstOrCreate(['name' => 'teacher'], ['display_name' => 'Teacher']);
        Role::firstOrCreate(['name' => 'student'], ['display_name' => 'Student']);

        // Create teacher with pre-set custodial address to avoid web3 calls
        $this->teacher = User::factory()->create([
            'email' => 'teacher@example.com',
            'first_name' => 'John',
            'last_name' => 'Teacher',
            'custodial_address' => 'addr_test1qzteacher123mockaddressfortesting'
        ]);
        $this->teacher->attachRole('teacher');

        // Create student with pre-set custodial address to avoid web3 calls
        $this->student = User::factory()->create([
            'email' => 'student@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'custodial_address' => 'addr_test1qzstudent123mockaddressfortesting'
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
        $otherTeacher = User::factory()->create([
            'custodial_address' => 'addr_test1qzotherteacher123mockaddress'
        ]);
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

    // New endpoint tests for Task #4

    public function test_get_eligible_students_requires_authentication()
    {
        $response = $this->getJson("/api/certificates/courses/{$this->course->id}/eligible-students");

        $response->assertStatus(401);
    }

    public function test_get_eligible_students_requires_teacher_role()
    {
        $response = $this->actingAs($this->student)
            ->getJson("/api/certificates/courses/{$this->course->id}/eligible-students");

        // Controller middleware redirects non-teachers
        $response->assertStatus(302);
    }

    public function test_get_eligible_students_rejects_unauthorized_teacher()
    {
        $otherTeacher = User::factory()->create([
            'custodial_address' => 'addr_test1qzother2teacher123mockaddress'
        ]);
        $otherTeacher->attachRole('teacher');

        $response = $this->actingAs($otherTeacher)
            ->getJson("/api/certificates/courses/{$this->course->id}/eligible-students");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to access this course.'
            ]);
    }

    public function test_get_eligible_students_returns_students_with_status()
    {
        // Mock the service to return eligible students
        $this->certificateService
            ->shouldReceive('getEligibleStudentsWithStatus')
            ->once()
            ->with(Mockery::on(function($course) {
                return $course->id === $this->course->id;
            }))
            ->andReturn([
                'success' => true,
                'message' => 'Eligible students retrieved successfully',
                'data' => [
                    'course_id' => $this->course->id,
                    'course_title' => $this->course->title,
                    'students' => [
                        [
                            'id' => $this->student->id,
                            'name' => $this->student->fullname,
                            'email' => $this->student->email,
                            'certificate_status' => 'eligible',
                            'completed_at' => now()->toISOString()
                        ]
                    ],
                    'total_eligible' => 1
                ]
            ]);

        $response = $this->actingAs($this->teacher)
            ->getJson("/api/certificates/courses/{$this->course->id}/eligible-students");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Eligible students retrieved successfully'
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'course_id',
                    'course_title',
                    'students',
                    'total_eligible'
                ]
            ]);
    }

    public function test_mint_single_certificate_requires_authentication()
    {
        $response = $this->postJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        $response->assertStatus(401);
    }

    public function test_mint_single_certificate_requires_teacher_role()
    {
        $response = $this->actingAs($this->student)
            ->postJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        // Controller middleware redirects non-teachers
        $response->assertStatus(302);
    }

    public function test_mint_single_certificate_rejects_unauthorized_teacher()
    {
        $otherTeacher = User::factory()->create([
            'custodial_address' => 'addr_test1qzother3teacher123mockaddress'
        ]);
        $otherTeacher->attachRole('teacher');

        $response = $this->actingAs($otherTeacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to mint certificates for this course.'
            ]);
    }

    public function test_mint_single_certificate_success()
    {
        // Mock the service to return success
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Certificate minted and airdropped successfully',
                'transaction_id' => 'tx123abc',
                'wallet_address' => 'addr1test123'
            ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Certificate minted and airdropped successfully',
                'transaction_id' => 'tx123abc'
            ]);
    }

    public function test_mint_single_certificate_handles_failure()
    {
        // Mock the service to return failure
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Failed to mint certificate: Wallet not found'
            ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Failed to mint certificate: Wallet not found'
            ]);
    }

    public function test_batch_mint_certificates_requires_authentication()
    {
        $response = $this->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
            'student_ids' => [$this->student->id]
        ]);

        $response->assertStatus(401);
    }

    public function test_batch_mint_certificates_requires_teacher_role()
    {
        $response = $this->actingAs($this->student)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [$this->student->id]
            ]);

        // Controller middleware redirects non-teachers
        $response->assertStatus(302);
    }

    public function test_batch_mint_certificates_validates_student_ids()
    {
        // Test with missing student_ids
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids']);

        // Test with empty array
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => []
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids']);

        // Test with invalid student_id format
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => ['invalid']
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids.0']);
    }

    public function test_batch_mint_certificates_rejects_unauthorized_teacher()
    {
        $otherTeacher = User::factory()->create([
            'custodial_address' => 'addr_test1qzother4teacher123mockaddress'
        ]);
        $otherTeacher->attachRole('teacher');

        $response = $this->actingAs($otherTeacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [$this->student->id]
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to mint certificates for this course.'
            ]);
    }

    public function test_batch_mint_certificates_success()
    {
        // Create additional students
        $student2 = User::factory()->create([
            'custodial_address' => 'addr_test1qzstudent2mockaddressfortesting'
        ]);
        $student2->attachRole('student');

        // Mock the service to return success for both students
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->twice()
            ->andReturn([
                'success' => true,
                'message' => 'Certificate minted and airdropped successfully',
                'transaction_id' => 'tx123abc'
            ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [$this->student->id, $student2->id]
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_processed' => 2,
                    'success_count' => 2,
                    'failure_count' => 0
                ]
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'total_processed',
                    'success_count',
                    'failure_count',
                    'results' => [
                        '*' => [
                            'student_id',
                            'student_name',
                            'success',
                            'message',
                            'transaction_id'
                        ]
                    ]
                ]
            ]);
    }

    public function test_batch_mint_certificates_handles_partial_failures()
    {
        // Create additional student
        $student2 = User::factory()->create([
            'custodial_address' => 'addr_test1qzstudent3mockaddressfortesting'
        ]);
        $student2->attachRole('student');

        // Mock the service to return success for first, failure for second
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Certificate minted and airdropped successfully',
                'transaction_id' => 'tx123abc'
            ])
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Minting failed'
            ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [$this->student->id, $student2->id]
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_processed' => 2,
                    'success_count' => 1,
                    'failure_count' => 1
                ]
            ]);
    }

    public function test_get_certificate_status_requires_authentication()
    {
        $response = $this->getJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        $response->assertStatus(401);
    }

    public function test_get_certificate_status_requires_teacher_role()
    {
        $response = $this->actingAs($this->student)
            ->getJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        // Controller middleware redirects non-teachers
        $response->assertStatus(302);
    }

    public function test_get_certificate_status_rejects_unauthorized_teacher()
    {
        $otherTeacher = User::factory()->create([
            'custodial_address' => 'addr_test1qzother5teacher123mockaddress'
        ]);
        $otherTeacher->attachRole('teacher');

        $response = $this->actingAs($otherTeacher)
            ->getJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to access this course.'
            ]);
    }

    public function test_get_certificate_status_returns_eligible_status()
    {
        // Mock the service to return eligible status
        $this->certificateService
            ->shouldReceive('getCertificateStatusForStudent')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Student is eligible for certificate',
                'data' => [
                    'student_id' => $this->student->id,
                    'course_id' => $this->course->id,
                    'status' => 'eligible',
                    'completed_at' => now()->toISOString()
                ]
            ]);

        $response = $this->actingAs($this->teacher)
            ->getJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Student is eligible for certificate',
                'data' => [
                    'status' => 'eligible'
                ]
            ]);
    }

    public function test_get_certificate_status_returns_minted_status()
    {
        // Mock the service to return minted status
        $this->certificateService
            ->shouldReceive('getCertificateStatusForStudent')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Certificate already minted',
                'data' => [
                    'student_id' => $this->student->id,
                    'course_id' => $this->course->id,
                    'status' => 'minted',
                    'tx_hash' => 'tx123abc',
                    'explorer_url' => 'https://preprod.cardanoscan.io/transaction/tx123abc',
                    'minted_at' => now()->toISOString()
                ]
            ]);

        $response = $this->actingAs($this->teacher)
            ->getJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Certificate already minted',
                'data' => [
                    'status' => 'minted',
                    'tx_hash' => 'tx123abc'
                ]
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'student_id',
                    'course_id',
                    'status',
                    'tx_hash',
                    'explorer_url',
                    'minted_at'
                ]
            ]);
    }

    public function test_get_certificate_status_returns_not_completed()
    {
        // Create a student who hasn't completed the course
        $newStudent = User::factory()->create([
            'custodial_address' => 'addr_test1qznewstudentmockaddressfortesting'
        ]);
        $newStudent->attachRole('student');

        // Mock the service to return not completed status
        $this->certificateService
            ->shouldReceive('getCertificateStatusForStudent')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Student has not completed this course',
                'data' => [
                    'student_id' => $newStudent->id,
                    'course_id' => $this->course->id,
                    'status' => 'not_completed'
                ]
            ]);

        $response = $this->actingAs($this->teacher)
            ->getJson("/api/certificates/courses/{$this->course->id}/students/{$newStudent->id}/status");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Student has not completed this course'
            ]);
    }
}