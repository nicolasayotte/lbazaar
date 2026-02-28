<?php

namespace Tests\Feature\Http\Controllers\Portal;

use Tests\TestCase;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;

class StudentRewardsControllerTest extends TestCase
{
    private User $user;
    private Course $course;
    private CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createRoles(['student', 'teacher']);
        $this->createCourseType();

        $this->user = $this->createTestUser();
        $this->user->attachRole('student');

        $this->course = Course::factory()->create([
            'title' => 'Test Rewards Course',
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/mypage/certificates');

        $response->assertRedirect('/portal/login');
    }

    public function test_certificates_index_renders_inertia_page_with_rewards_prop(): void
    {
        CourseHistory::factory()->create([
            'user_id'                      => $this->user->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $this->schedule->id,
            'completed_at'                 => now()->subDays(1),
            'enrolled_certificate_enabled' => true,
            'enrolled_token_reward_enabled' => false,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/mypage/certificates');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Portal/MyPage/Badges/Index')
                ->has('rewards')
            );
    }

    public function test_certificates_index_passes_empty_rewards_when_no_completions(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/mypage/certificates');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Portal/MyPage/Badges/Index')
                ->where('rewards', [])
            );
    }
}
