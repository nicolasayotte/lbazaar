<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use Tests\TestCase;

class ManageCertificateControllerTest extends TestCase
{
    protected User $admin;
    protected User $teacher;
    protected User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createRoles(['admin', 'teacher', 'student']);

        $this->admin = $this->createTestUser(['email' => 'admin_mgcert_test@example.com']);
        $this->admin->attachRole('admin');

        $this->teacher = $this->createTestUser(['email' => 'teacher_mgcert_test@example.com']);
        $this->teacher->attachRole('teacher');

        $this->student = $this->createTestUser(['email' => 'student_mgcert_test@example.com']);
        $this->student->attachRole('student');
    }

    public function test_admin_can_view_certificates_roster(): void
    {
        $course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'certificate_enabled' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->get("/admin/courses/{$course->id}/certificates");

        $response->assertStatus(200);
    }

    public function test_non_admin_is_redirected(): void
    {
        $course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
        ]);

        $response = $this->actingAs($this->teacher)
            ->get("/admin/courses/{$course->id}/certificates");

        // Non-admin redirected (302) by the admin middleware
        $response->assertStatus(302);
    }

    public function test_unauthenticated_is_redirected(): void
    {
        $course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
        ]);

        $response = $this->get("/admin/courses/{$course->id}/certificates");

        $response->assertStatus(302);
    }

    public function test_returns_404_for_nonexistent_course(): void
    {
        $response = $this->actingAs($this->admin)
            ->get('/admin/courses/999999/certificates');

        $response->assertStatus(404);
    }

    public function test_admin_can_view_course_owned_by_different_teacher(): void
    {
        $otherTeacher = $this->createTestUser(['email' => 'other_teacher_mgcert@example.com']);
        $otherTeacher->attachRole('teacher');

        $course = Course::factory()->create([
            'professor_id'        => $otherTeacher->id,
            'certificate_enabled' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->get("/admin/courses/{$course->id}/certificates");

        // Admin can view certificate roster for any course regardless of professor_id
        $response->assertStatus(200);
    }

    public function test_inertia_props_are_correct(): void
    {
        $course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'certificate_enabled' => true,
            'token_reward_enabled' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->get("/admin/courses/{$course->id}/certificates");

        $response->assertStatus(200)
            ->assertInertia(fn ($page) =>
                $page->component('Portal/MyPage/ManageClass/Certificates')
                     ->where('tabValue', 'certificates')
                     ->where('courseId', $course->id)
                     ->where('has_rewards', true)
                     ->where('token_reward_enabled', false)
                     ->has('students')
                     ->has('course')
                     ->has('explorerUrl')
            );
    }

    public function test_has_rewards_prop_is_false_when_no_rewards_enabled(): void
    {
        $course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'certificate_enabled' => false,
            'token_reward_enabled' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->get("/admin/courses/{$course->id}/certificates");

        $response->assertStatus(200)
            ->assertInertia(fn ($page) =>
                $page->where('has_rewards', false)
            );
    }

    public function test_student_roster_includes_delivery_status(): void
    {
        $course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'certificate_enabled' => true,
        ]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $course->id,
            'user_id'   => $this->teacher->id,
        ]);

        CourseHistory::factory()->create([
            'user_id'            => $this->student->id,
            'course_id'          => $course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at'       => now()->subDay(),
            'certificate_status' => null,
            'is_cancelled'       => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->get("/admin/courses/{$course->id}/certificates");

        $response->assertStatus(200)
            ->assertInertia(fn ($page) =>
                $page->has('students')
                     ->has('students.0.delivery_status')
            );
    }
}
