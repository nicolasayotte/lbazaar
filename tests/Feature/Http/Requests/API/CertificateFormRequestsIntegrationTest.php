<?php

namespace Tests\Feature\Http\Requests\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\User;
use App\Models\Course;
use App\Models\Role;

/**
 * Integration tests to verify Form Requests work correctly in HTTP context
 */
class CertificateFormRequestsIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    protected $teacher;
    protected $student;
    protected $course;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::firstOrCreate(['name' => 'teacher'], ['display_name' => 'Teacher']);
        Role::firstOrCreate(['name' => 'student'], ['display_name' => 'Student']);

        // Create teacher
        $this->teacher = User::factory()->create();
        $this->teacher->attachRole('teacher');

        // Create student
        $this->student = User::factory()->create();
        $this->student->attachRole('student');

        // Create course
        $this->course = Course::factory()->create([
            'professor_id' => $this->teacher->id
        ]);
    }

    public function test_mint_single_certificate_request_validates_in_http_context()
    {
        // Test missing required fields
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-single', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed'
            ])
            ->assertJsonStructure(['errors']);
    }

    public function test_mint_single_certificate_request_authorizes_teacher_ownership()
    {
        // Create another teacher's course
        $otherTeacher = User::factory()->create();
        $otherTeacher->attachRole('teacher');
        $otherCourse = Course::factory()->create([
            'professor_id' => $otherTeacher->id
        ]);

        // Attempt to mint certificate for course not owned by authenticated teacher
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-single', [
                'course_id' => $otherCourse->id,
                'student_id' => $this->student->id
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to mint certificates for this course.'
            ]);
    }

    public function test_batch_mint_certificates_request_validates_in_http_context()
    {
        // Test missing required fields
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-batch', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed'
            ])
            ->assertJsonStructure(['errors']);
    }

    public function test_batch_mint_certificates_request_validates_student_ids_array()
    {
        // Test with empty student_ids array
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-batch', [
                'course_id' => $this->course->id,
                'student_ids' => []
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed'
            ])
            ->assertJsonValidationErrors(['student_ids']);
    }

    public function test_batch_mint_certificates_request_shows_custom_error_messages()
    {
        // Test with missing student_ids
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-batch', [
                'course_id' => $this->course->id
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids']);

        $errors = $response->json('errors');
        $this->assertStringContainsString(
            'At least one student must be selected',
            $errors['student_ids'][0]
        );
    }

    public function test_batch_mint_certificates_request_authorizes_teacher_ownership()
    {
        // Create another teacher's course
        $otherTeacher = User::factory()->create();
        $otherTeacher->attachRole('teacher');
        $otherCourse = Course::factory()->create([
            'professor_id' => $otherTeacher->id
        ]);

        // Attempt to mint certificates for course not owned by authenticated teacher
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/certificates/mint-batch', [
                'course_id' => $otherCourse->id,
                'student_ids' => [$this->student->id]
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to mint certificates for this course.'
            ]);
    }

    public function test_form_requests_reject_non_teacher_users()
    {
        // Test MintSingleCertificateRequest
        $response = $this->actingAs($this->student)
            ->postJson('/api/certificates/mint-single', [
                'course_id' => $this->course->id,
                'student_id' => $this->student->id
            ]);

        $response->assertStatus(403);

        // Test BatchMintCertificatesRequest
        $response = $this->actingAs($this->student)
            ->postJson('/api/certificates/mint-batch', [
                'course_id' => $this->course->id,
                'student_ids' => [$this->student->id]
            ]);

        $response->assertStatus(403);
    }

    public function test_form_requests_require_authentication()
    {
        // Test MintSingleCertificateRequest without auth
        $response = $this->postJson('/api/certificates/mint-single', [
            'course_id' => $this->course->id,
            'student_id' => $this->student->id
        ]);

        $response->assertStatus(401);

        // Test BatchMintCertificatesRequest without auth
        $response = $this->postJson('/api/certificates/mint-batch', [
            'course_id' => $this->course->id,
            'student_ids' => [$this->student->id]
        ]);

        $response->assertStatus(401);
    }
}
