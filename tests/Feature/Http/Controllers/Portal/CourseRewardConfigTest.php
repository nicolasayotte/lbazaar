<?php

namespace Tests\Feature\Http\Controllers\Portal;

use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CourseRewardConfigTest extends TestCase
{
    protected User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->retryOnDisconnect(function () {
            $this->createRoles(['teacher', 'student']);
            $this->teacher = $this->createTestUser();
            $this->teacher->attachRole('teacher');
        });
    }

    /**
     * Build the minimum valid payload for the course store endpoint.
     * All CourseRequest required fields are included; overrides are merged in.
     */
    private function buildStorePayload(array $overrides = []): array
    {
        Storage::fake('thumbnail');

        return array_merge([
            'title'           => 'Test Course',
            'description'     => 'A description',
            'category'        => 'General',
            'course_type_id'  => $this->createCourseType('general', 'general')->id,
            'max_participant' => 10,
            'format'          => Course::LIVE,
            'zoom_link'       => 'https://zoom.us/j/123456',
            'is_cancellable'  => false,
            'image_thumbnail' => UploadedFile::fake()->image('thumbnail.jpg'),
        ], $overrides);
    }

    /**
     * Create an approved CourseApplication that has no course yet.
     */
    private function createApprovedApplication(): CourseApplication
    {
        $courseType = $this->createCourseType('general', 'general');

        return CourseApplication::factory()->create([
            'professor_id'   => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'approved_at'    => now(),
        ]);
    }

    public function test_store_saves_certificate_enabled_with_metadata(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'certificate_enabled'     => true,
            'certificate_name'        => 'My Certificate',
            'certificate_description' => 'Award for completion',
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('courses', [
            'course_application_id'   => $application->id,
            'certificate_name'        => 'My Certificate',
            'certificate_description' => 'Award for completion',
        ]);

        $course = Course::where('course_application_id', $application->id)->first();
        $this->assertNotNull($course);
        $this->assertTrue($course->certificate_enabled);
    }

    public function test_store_saves_certificate_disabled_without_metadata(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'certificate_enabled' => false,
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $course = Course::where('course_application_id', $application->id)->first();
        $this->assertNotNull($course);
        $this->assertFalse($course->certificate_enabled);
        $this->assertNull($course->certificate_name);
    }

    public function test_store_fails_when_certificate_enabled_but_name_missing(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'certificate_enabled'     => true,
            'certificate_name'        => '',
            'certificate_description' => 'Some description',
        ]));

        $response->assertSessionHasErrors('certificate_name');
    }

    public function test_store_saves_token_reward_enabled_with_amount(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'token_reward_enabled' => true,
            'token_reward_amount'  => 100,
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $course = Course::where('course_application_id', $application->id)->first();
        $this->assertNotNull($course);
        $this->assertTrue($course->token_reward_enabled);
        $this->assertEquals(100, $course->token_reward_amount);
    }

    public function test_store_fails_when_token_reward_enabled_but_amount_missing(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'token_reward_enabled' => true,
            'token_reward_amount'  => null,
        ]));

        $response->assertSessionHasErrors('token_reward_amount');
    }

    public function test_store_fails_when_token_reward_amount_exceeds_max(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'token_reward_enabled' => true,
            'token_reward_amount'  => 1000001,
        ]));

        $response->assertSessionHasErrors('token_reward_amount');
    }

    public function test_store_saves_both_rewards_independently(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'certificate_enabled'     => true,
            'certificate_name'        => 'Full Cert',
            'certificate_description' => 'Awarded for mastery',
            'token_reward_enabled'    => true,
            'token_reward_amount'     => 500,
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $course = Course::where('course_application_id', $application->id)->first();
        $this->assertNotNull($course);
        $this->assertTrue($course->certificate_enabled);
        $this->assertEquals('Full Cert', $course->certificate_name);
        $this->assertEquals('Awarded for mastery', $course->certificate_description);
        $this->assertTrue($course->token_reward_enabled);
        $this->assertEquals(500, $course->token_reward_amount);
    }

    public function test_store_saves_certificate_image_url_when_provided(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'certificate_enabled'     => true,
            'certificate_name'        => 'My Certificate',
            'certificate_description' => 'Award for completion',
            'certificate_image_url'   => 'https://example.com/cert-image.png',
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('courses', [
            'course_application_id' => $application->id,
            'certificate_image_url' => 'https://example.com/cert-image.png',
        ]);
    }

    public function test_store_accepts_null_certificate_image_url(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'certificate_enabled'     => true,
            'certificate_name'        => 'My Certificate',
            'certificate_description' => 'Award for completion',
            'certificate_image_url'   => null,
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $course = Course::where('course_application_id', $application->id)->first();
        $this->assertNotNull($course);
        $this->assertNull($course->certificate_image_url);
    }

    public function test_store_rejects_invalid_certificate_image_url(): void
    {
        $this->actingAs($this->teacher);
        $application = $this->createApprovedApplication();

        $response = $this->post(route('course.store', ['id' => $application->id]), $this->buildStorePayload([
            'certificate_enabled'     => true,
            'certificate_name'        => 'My Certificate',
            'certificate_description' => 'Award for completion',
            'certificate_image_url'   => 'not-a-valid-url',
        ]));

        $response->assertSessionHasErrors('certificate_image_url');
    }

    public function test_update_saves_reward_config_changes(): void
    {
        $this->actingAs($this->teacher);
        $courseType = $this->createCourseType('general', 'general');

        $course = Course::factory()->create([
            'professor_id'        => $this->teacher->id,
            'course_type_id'      => $courseType->id,
            'is_live'             => true,
            'certificate_enabled' => false,
            'certificate_name'    => null,
            'token_reward_enabled' => false,
            'token_reward_amount'  => null,
        ]);

        Storage::fake('thumbnail');

        $response = $this->post(route('course.update', ['id' => $course->id]), [
            'title'                   => $course->title,
            'description'             => $course->description,
            'category'                => 'General',
            'course_type_id'          => $courseType->id,
            'max_participant'         => $course->max_participant,
            'format'                  => Course::LIVE,
            'zoom_link'               => 'https://zoom.us/j/999',
            'is_cancellable'          => false,
            'image_thumbnail'         => UploadedFile::fake()->image('thumb.jpg'),
            'certificate_enabled'     => true,
            'certificate_name'        => 'Updated Cert',
            'certificate_description' => 'Updated description',
            'token_reward_enabled'    => true,
            'token_reward_amount'     => 250,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $fresh = $course->fresh();
        $this->assertTrue($fresh->certificate_enabled);
        $this->assertEquals('Updated Cert', $fresh->certificate_name);
        $this->assertEquals('Updated description', $fresh->certificate_description);
        $this->assertTrue($fresh->token_reward_enabled);
        $this->assertEquals(250, $fresh->token_reward_amount);
    }
}
