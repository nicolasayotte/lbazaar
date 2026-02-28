<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use App\Services\API\CertificateService;
use Mockery;
use Tests\TestCase;

class CertificateControllerTest extends TestCase
{
    protected $certificateService;
    protected User $admin;
    protected User $teacher;
    protected User $student;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->certificateService = Mockery::mock(CertificateService::class);
        $this->app->instance(CertificateService::class, $this->certificateService);

        $this->createRoles(['admin', 'teacher', 'student']);

        $this->admin = $this->createTestUser(['email' => 'admin_cert_test@example.com']);
        $this->admin->attachRole('admin');

        $this->teacher = $this->createTestUser(['email' => 'teacher_cert_test@example.com']);
        $this->teacher->attachRole('teacher');

        $this->student = $this->createTestUser(['email' => 'student_cert_test@example.com']);
        $this->student->attachRole('student');

        // Course owned by teacher (not admin) — proves admin can cross ownership boundary
        $this->course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'certificate_enabled' => true,
        ]);
    }

    // -------------------------------------------------------------------------
    // estimate_fee
    // -------------------------------------------------------------------------

    public function test_estimate_fee_requires_authentication(): void
    {
        $response = $this->postJson("/api/admin/certificates/courses/{$this->course->id}/estimate-fee", [
            'student_ids' => [$this->student->id],
        ]);

        $response->assertStatus(401);
    }

    public function test_estimate_fee_rejects_teacher(): void
    {
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/estimate-fee", [
                'student_ids' => [$this->student->id],
            ]);

        $response->assertStatus(403);
    }

    public function test_estimate_fee_rejects_student(): void
    {
        $response = $this->actingAs($this->student)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/estimate-fee", [
                'student_ids' => [$this->student->id],
            ]);

        $response->assertStatus(403);
    }

    public function test_estimate_fee_admin_can_estimate_for_any_course(): void
    {
        $this->certificateService
            ->shouldReceive('estimateAirdropFee')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Fee estimated successfully',
                'data'    => [
                    'student_count'           => 1,
                    'per_student_lovelace'    => 2_500_000,
                    'fee_lovelace'            => 2_500_000,
                    'fee_ada'                 => 2.5,
                    'insufficient'            => false,
                    'shortfall_lovelace'      => 0,
                    'wallet_balance_lovelace' => PHP_INT_MAX,
                ],
            ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/estimate-fee", [
                'student_ids' => [$this->student->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'fee_payer'   => 'platform',
                    'insufficient' => false,
                ],
            ]);
    }

    public function test_estimate_fee_response_always_has_fee_payer_platform_and_insufficient_false(): void
    {
        // Even if service would return insufficient=true, admin controller overrides it
        $this->certificateService
            ->shouldReceive('estimateAirdropFee')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Fee estimated successfully',
                'data'    => [
                    'student_count'        => 1,
                    'per_student_lovelace' => 2_500_000,
                    'fee_lovelace'         => 2_500_000,
                    'fee_ada'              => 2.5,
                    'insufficient'         => true, // service returns true
                    'shortfall_lovelace'   => 1_000_000,
                    'wallet_balance_lovelace' => 1_500_000,
                ],
            ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/estimate-fee", [
                'student_ids' => [$this->student->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'fee_payer'   => 'platform',
                    'insufficient' => false,
                ],
            ]);
    }

    // -------------------------------------------------------------------------
    // eligible_students
    // -------------------------------------------------------------------------

    public function test_eligible_students_requires_authentication(): void
    {
        $response = $this->getJson("/api/admin/certificates/courses/{$this->course->id}/eligible-students");

        $response->assertStatus(401);
    }

    public function test_eligible_students_rejects_non_admin(): void
    {
        $response = $this->actingAs($this->teacher)
            ->getJson("/api/admin/certificates/courses/{$this->course->id}/eligible-students");

        $response->assertStatus(403);
    }

    public function test_eligible_students_admin_can_get_for_any_course(): void
    {
        $this->certificateService
            ->shouldReceive('getEligibleStudentsWithStatus')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Eligible students retrieved successfully',
                'data'    => [
                    'course_id'      => $this->course->id,
                    'course_title'   => $this->course->title,
                    'students'       => [],
                    'total_eligible' => 0,
                ],
            ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/certificates/courses/{$this->course->id}/eligible-students");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    // -------------------------------------------------------------------------
    // mint_single
    // -------------------------------------------------------------------------

    public function test_mint_single_requires_authentication(): void
    {
        $response = $this->postJson("/api/admin/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        $response->assertStatus(401);
    }

    public function test_mint_single_rejects_non_admin(): void
    {
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        $response->assertStatus(403);
    }

    public function test_mint_single_admin_can_mint_for_any_course(): void
    {
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success'        => true,
                'message'        => 'Certificate minted and airdropped successfully',
                'transaction_id' => 'tx_admin_123',
                'wallet_address' => 'addr1test_admin',
            ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/students/{$this->student->id}/mint");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Certificate minted and airdropped successfully',
            ]);
    }

    // -------------------------------------------------------------------------
    // batch_mint
    // -------------------------------------------------------------------------

    public function test_batch_mint_requires_authentication(): void
    {
        $response = $this->postJson("/api/admin/certificates/courses/{$this->course->id}/batch-mint", [
            'student_ids' => [$this->student->id],
        ]);

        $response->assertStatus(401);
    }

    public function test_batch_mint_rejects_non_admin(): void
    {
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [$this->student->id],
            ]);

        $response->assertStatus(403);
    }

    public function test_batch_mint_validates_student_ids_required(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/batch-mint", []);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_batch_mint_validates_student_ids_not_empty(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [],
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_batch_mint_admin_can_batch_mint_for_any_course(): void
    {
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andReturn([
                'success'        => true,
                'message'        => 'Certificate minted and airdropped successfully',
                'transaction_id' => 'tx_admin_batch_1',
            ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/certificates/courses/{$this->course->id}/batch-mint", [
                'student_ids' => [$this->student->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'total_processed' => 1,
                    'success_count'   => 1,
                    'failure_count'   => 0,
                ],
            ]);
    }

    // -------------------------------------------------------------------------
    // certificate_status
    // -------------------------------------------------------------------------

    public function test_certificate_status_requires_authentication(): void
    {
        $response = $this->getJson("/api/admin/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        $response->assertStatus(401);
    }

    public function test_certificate_status_rejects_non_admin(): void
    {
        $response = $this->actingAs($this->teacher)
            ->getJson("/api/admin/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        $response->assertStatus(403);
    }

    public function test_certificate_status_admin_can_get_for_any_course(): void
    {
        $this->certificateService
            ->shouldReceive('getCertificateStatusForStudent')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Student is eligible for certificate',
                'data'    => [
                    'student_id' => $this->student->id,
                    'course_id'  => $this->course->id,
                    'status'     => 'eligible',
                ],
            ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/certificates/courses/{$this->course->id}/students/{$this->student->id}/status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => ['status' => 'eligible'],
            ]);
    }

    // -------------------------------------------------------------------------
    // Cross-course access: admin accesses course owned by a different teacher
    // -------------------------------------------------------------------------

    public function test_admin_can_access_course_owned_by_different_teacher(): void
    {
        $otherTeacher = $this->createTestUser(['email' => 'other_teacher_cert@example.com']);
        $otherTeacher->attachRole('teacher');

        $otherCourse = Course::factory()->create([
            'professor_id'        => $otherTeacher->id,
            'certificate_enabled' => true,
        ]);

        $this->certificateService
            ->shouldReceive('getEligibleStudentsWithStatus')
            ->once()
            ->andReturn([
                'success' => true,
                'message' => 'Eligible students retrieved successfully',
                'data'    => ['students' => [], 'total_eligible' => 0],
            ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/certificates/courses/{$otherCourse->id}/eligible-students");

        // Admin can access regardless of professor_id
        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
