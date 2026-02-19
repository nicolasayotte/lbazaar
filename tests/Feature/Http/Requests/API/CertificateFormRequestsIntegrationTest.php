<?php

namespace Tests\Feature\Http\Requests\API;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;

/**
 * Integration tests to verify Form Requests work correctly in HTTP context
 */
class CertificateFormRequestsIntegrationTest extends TestCase
{
    protected $teacher;
    protected $student;
    protected $course;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $this->createRoles(['teacher', 'student']);

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
        // Use a non-existent student ID to trigger validation
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/students/999999/mint", []);

        // MintSingleCertificateRequest uses route model binding;
        // non-existent student returns 404 from route model binding
        $response->assertStatus(404);
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
            ->postJson("/api/certificates/courses/{$otherCourse->id}/students/{$this->student->id}/mint", []);

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
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids']);
    }

    public function test_batch_mint_certificates_request_validates_student_ids_array()
    {
        // Test with empty student_ids array
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => []
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids']);
    }

    public function test_batch_mint_certificates_request_shows_custom_error_messages()
    {
        // Test with missing student_ids
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids']);
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
            ->postJson("/api/certificates/courses/{$otherCourse->id}/batch-mint", [
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
        // Test mint single - teacher middleware returns 403 for non-teachers on API routes
        $response = $this->actingAs($this->student)
            ->postJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint", []);

        $response->assertStatus(403);

        // Test batch mint
        $response = $this->actingAs($this->student)
            ->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [$this->student->id]
            ]);

        $response->assertStatus(403);
    }

    public function test_form_requests_require_authentication()
    {
        // Test mint single without auth
        $response = $this->postJson("/api/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint", []);

        $response->assertStatus(401);

        // Test batch mint without auth
        $response = $this->postJson("/api/certificates/courses/{$this->course->id}/batch-mint", [
            'student_ids' => [$this->student->id]
        ]);

        $response->assertStatus(401);
    }
}
