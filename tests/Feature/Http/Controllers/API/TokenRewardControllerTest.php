<?php

namespace Tests\Feature\Http\Controllers\API;

use Tests\TestCase;
use App\Services\API\TokenRewardService;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\Sanctum;
use Mockery;

class TokenRewardControllerTest extends TestCase
{
    protected $tokenRewardService;
    protected User $teacher;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        // Bind mock service to prevent real web3/DB calls in controller tests
        $this->tokenRewardService = Mockery::mock(TokenRewardService::class);
        $this->app->instance(TokenRewardService::class, $this->tokenRewardService);

        $this->disableUserModelEvents();
        $this->setupTestData();
    }

    private function setupTestData(): void
    {
        $this->createRoles(['teacher', 'student']);
        $courseType = $this->createCourseType();

        $this->teacher = User::factory()->create([
            'email'             => 'token-teacher@example.com',
            'first_name'        => 'Token',
            'last_name'         => 'Teacher',
            'custodial_address' => 'addr_test1qzteacher_token_reward',
        ]);
        $this->teacher->attachRole('teacher');

        $this->student = User::factory()->create([
            'email'             => 'token-student@example.com',
            'first_name'        => 'Token',
            'last_name'         => 'Student',
            'custodial_address' => 'addr_test1qzstudent_token_reward',
        ]);
        $this->student->attachRole('student');

        UserWallet::factory()->create([
            'user_id'       => $this->student->id,
            'points'        => 100,
            'stake_key_hash' => 'tokenstakekey123',
        ]);

        $this->course = Course::factory()->create([
            'title'                => 'Token Reward Course',
            'professor_id'         => $this->teacher->id,
            'course_type_id'       => $courseType->id,
            'token_reward_enabled' => true,
            'token_reward_amount'  => 100,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id'   => $this->teacher->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // PUT /api/courses/{course}/token-reward — updateConfig
    // -------------------------------------------------------------------------

    public function test_update_config_requires_auth(): void
    {
        $response = $this->putJson("/api/courses/{$this->course->id}/token-reward", [
            'token_reward_enabled' => true,
            'token_reward_amount'  => 50,
        ]);

        $response->assertStatus(401);
    }

    public function test_update_config_requires_teacher_ownership(): void
    {
        // Another teacher who does not own the course
        $otherTeacher = User::factory()->create([
            'custodial_address' => 'addr_test1qzother_teacher',
        ]);
        $otherTeacher->attachRole('teacher');

        Sanctum::actingAs($otherTeacher);

        $response = $this->putJson("/api/courses/{$this->course->id}/token-reward", [
            'token_reward_enabled' => true,
            'token_reward_amount'  => 50,
        ]);

        $response->assertStatus(403)
                 ->assertJson([
                     'success' => false,
                     'message' => 'You do not have permission to update this course.',
                 ]);
    }

    public function test_update_config_returns_422_on_invalid_amount(): void
    {
        Sanctum::actingAs($this->teacher);

        $response = $this->putJson("/api/courses/{$this->course->id}/token-reward", [
            'token_reward_enabled' => true,
            'token_reward_amount'  => -5,
        ]);

        $response->assertStatus(422)
                 ->assertJson(['success' => false])
                 ->assertJsonValidationErrors(['token_reward_amount']);
    }

    public function test_update_config_returns_422_on_amount_too_large(): void
    {
        Sanctum::actingAs($this->teacher);

        $response = $this->putJson("/api/courses/{$this->course->id}/token-reward", [
            'token_reward_enabled' => true,
            'token_reward_amount'  => 1000001,
        ]);

        $response->assertStatus(422)
                 ->assertJson(['success' => false])
                 ->assertJsonValidationErrors(['token_reward_amount']);
    }

    public function test_update_config_succeeds(): void
    {
        Sanctum::actingAs($this->teacher);

        $this->tokenRewardService
            ->shouldReceive('updateTokenRewardConfig')
            ->once()
            ->with(
                Mockery::on(fn ($c) => $c->id === $this->course->id),
                true,
                250
            )
            ->andReturn([
                'success' => true,
                'message' => 'Token reward configuration updated.',
                'data'    => [
                    'token_reward_enabled' => true,
                    'token_reward_amount'  => 250,
                ],
            ]);

        $response = $this->putJson("/api/courses/{$this->course->id}/token-reward", [
            'token_reward_enabled' => true,
            'token_reward_amount'  => 250,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Token reward configuration updated.',
                     'data'    => [
                         'token_reward_enabled' => true,
                         'token_reward_amount'  => 250,
                     ],
                 ]);
    }

    // -------------------------------------------------------------------------
    // POST /api/courses/{course}/token-reward/mint — mintAndAirdrop
    // -------------------------------------------------------------------------

    public function test_mint_requires_auth(): void
    {
        $response = $this->postJson("/api/courses/{$this->course->id}/token-reward/mint");

        $response->assertStatus(401);
    }

    public function test_mint_requires_ownership(): void
    {
        // A student (not the course owner) tries to mint
        Sanctum::actingAs($this->student);

        $response = $this->postJson("/api/courses/{$this->course->id}/token-reward/mint");

        $response->assertStatus(403)
                 ->assertJson([
                     'success' => false,
                     'message' => 'You do not have permission to mint token rewards for this course.',
                 ]);
    }

    public function test_mint_returns_404_when_no_eligible_students(): void
    {
        Sanctum::actingAs($this->teacher);

        // No course history records exist — no eligible students
        $response = $this->postJson("/api/courses/{$this->course->id}/token-reward/mint");

        $response->assertStatus(404)
                 ->assertJson([
                     'success' => false,
                     'message' => 'No eligible students found for token reward minting.',
                 ]);
    }
}
