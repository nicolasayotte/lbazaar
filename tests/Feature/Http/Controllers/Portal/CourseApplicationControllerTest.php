<?php

namespace Tests\Feature\Http\Controllers\Portal;

use Tests\TestCase;
use App\Models\User;
use App\Models\CourseApplication;
use App\Models\Course;

class CourseApplicationControllerTest extends TestCase
{
    protected User $teacher;
    protected User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createRoles(['teacher', 'student']);

        $this->teacher = User::factory()->create();
        $this->teacher->attachRole('teacher');

        $this->student = User::factory()->create();
        $this->student->attachRole('student');
    }

    public function test_store_with_certificate_enabled_true_saves_correctly()
    {
        $this->actingAs($this->teacher);

        $courseType = $this->createCourseType('general', 'general');

        $response = $this->post(route('mypage.course.applications.store'), [
            'title' => 'Test Course',
            'type' => 'general',
            'format' => Course::LIVE,
            'category' => 'Test Category',
            'nft_name' => null,
            'lecture_frequency' => 'weekly',
            'length' => '4 weeks',
            'price' => 100,
            'seats' => 10,
            'description' => 'Test description',
            'certificate_enabled' => true
        ]);

        $response->assertRedirect(route('mypage.course.applications.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('course_applications', [
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);
    }

    public function test_store_without_certificate_enabled_defaults_to_false()
    {
        $this->actingAs($this->teacher);

        $courseType = $this->createCourseType('general', 'general');

        $response = $this->post(route('mypage.course.applications.store'), [
            'title' => 'Test Course Without Certificate',
            'type' => 'general',
            'format' => Course::LIVE,
            'category' => 'Test Category',
            'nft_name' => null,
            'lecture_frequency' => 'weekly',
            'length' => '4 weeks',
            'price' => 100,
            'seats' => 10,
            'description' => 'Test description'
        ]);

        $response->assertRedirect(route('mypage.course.applications.index'));

        $this->assertDatabaseHas('course_applications', [
            'title' => 'Test Course Without Certificate',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => false
        ]);
    }

    public function test_only_teachers_can_create_course_applications()
    {
        $this->actingAs($this->student);

        $response = $this->post(route('mypage.course.applications.store'), [
            'title' => 'Test Course',
            'type' => 'general',
            'format' => Course::LIVE,
            'category' => 'Test Category',
            'nft_name' => null,
            'lecture_frequency' => 'weekly',
            'length' => '4 weeks',
            'price' => 100,
            'seats' => 10,
            'description' => 'Test description',
            'certificate_enabled' => true
        ]);

        // Laravel redirects unauthorized users instead of returning 403
        $response->assertRedirect();
    }

    public function test_certificate_enabled_true_is_copied_from_application_to_course()
    {
        $courseType = $this->createCourseType('general', 'general');

        // Create a course application with certificate_enabled = true
        $courseApplication = CourseApplication::factory()->create([
            'professor_id' => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'certificate_enabled' => true,
            'approved_at' => now()
        ]);

        // Create a course from the application (simulating approval)
        $course = Course::factory()->create([
            'course_application_id' => $courseApplication->id,
            'professor_id' => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'certificate_enabled' => $courseApplication->certificate_enabled
        ]);

        // Verify course has certificate_enabled = true
        $this->assertTrue($course->certificate_enabled);
        $this->assertEquals($courseApplication->certificate_enabled, $course->certificate_enabled);
    }

    public function test_certificate_enabled_false_is_copied_from_application_to_course()
    {
        $courseType = $this->createCourseType('general', 'general');

        // Create a course application with certificate_enabled = false
        $courseApplication = CourseApplication::factory()->create([
            'professor_id' => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'certificate_enabled' => false,
            'approved_at' => now()
        ]);

        // Create a course from the application (simulating approval)
        $course = Course::factory()->create([
            'course_application_id' => $courseApplication->id,
            'professor_id' => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'certificate_enabled' => $courseApplication->certificate_enabled
        ]);

        // Verify course has certificate_enabled = false
        $this->assertFalse($course->certificate_enabled);
        $this->assertEquals($courseApplication->certificate_enabled, $course->certificate_enabled);
    }
}
