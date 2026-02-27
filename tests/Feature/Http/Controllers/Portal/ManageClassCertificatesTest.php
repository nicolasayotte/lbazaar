<?php

namespace Tests\Feature\Http\Controllers\Portal;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use Tests\TestCase;

class ManageClassCertificatesTest extends TestCase
{
    protected User $teacher;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createRoles(['teacher', 'student']);

        $this->teacher = $this->createTestUser([
            'custodial_address' => 'addr_test1qzteacher_mgclass_mock',
        ]);
        $this->teacher->attachRole('teacher');

        $this->student = $this->createTestUser([
            'custodial_address' => 'addr_test1qzstudent_mgclass_mock',
        ]);
        $this->student->attachRole('student');
    }

    // -------------------------------------------------------------------------
    // has_rewards prop tests (F-10.8 / F-10.10)
    // -------------------------------------------------------------------------

    public function test_certificates_page_passes_has_rewards_false(): void
    {
        $course = Course::factory()->create([
            'professor_id'       => $this->teacher->id,
            'certificate_enabled' => false,
            'token_reward_enabled' => false,
        ]);

        $response = $this->actingAs($this->teacher)
            ->get("/mypage/manage-class/{$course->id}/certificates");

        $response->assertStatus(200)
            ->assertInertia(fn ($page) =>
                $page->has('has_rewards')
                     ->where('has_rewards', false)
            );
    }

    public function test_certificates_page_passes_has_rewards_true(): void
    {
        $course = Course::factory()->create([
            'professor_id'       => $this->teacher->id,
            'certificate_enabled' => true,
            'token_reward_enabled' => false,
        ]);

        $response = $this->actingAs($this->teacher)
            ->get("/mypage/manage-class/{$course->id}/certificates");

        $response->assertStatus(200)
            ->assertInertia(fn ($page) =>
                $page->has('has_rewards')
                     ->where('has_rewards', true)
            );
    }

    // -------------------------------------------------------------------------
    // delivery_status in student roster (F-10.8)
    // -------------------------------------------------------------------------

    public function test_student_roster_returns_delivery_status(): void
    {
        $course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'certificate_enabled' => true,
            'token_reward_enabled' => false,
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

        $response = $this->actingAs($this->teacher)
            ->get("/mypage/manage-class/{$course->id}/certificates");

        $response->assertStatus(200)
            ->assertInertia(fn ($page) =>
                $page->has('students')
                     ->has('students.0.delivery_status')
            );
    }
}
