<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Course;
use App\Models\CourseType;
use App\Models\User;
use Database\Seeders\CourseTypeSeeder;

class CourseTypeAvailabilityTest extends TestCase
{
    protected User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed course types
        $seeder = new CourseTypeSeeder();
        $seeder->run();

        // Create roles
        $this->createRoles(['teacher']);

        // Create a teacher user
        $this->teacher = User::factory()->create();
        $this->teacher->attachRole('teacher');
    }

    /** @test */
    public function test_existing_earn_courses_still_viewable(): void
    {
        // Arrange: Create a Course with Earn type
        $earnCourse = Course::factory()->create([
            'course_type_id' => CourseType::EARN_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'Test Earn Course'
        ]);

        // Act: Load the course with its courseType relationship
        $loadedCourse = Course::with('courseType')->find($earnCourse->id);

        // Assert: Course can be loaded
        $this->assertNotNull($loadedCourse, 'Earn course should be loadable');
        $this->assertEquals(CourseType::EARN_ID, $loadedCourse->course_type_id, 'Course should have Earn type ID');

        // Assert: Course type relationship works
        $this->assertNotNull($loadedCourse->courseType, 'CourseType relationship should be loaded');
        $this->assertEquals(CourseType::EARN, $loadedCourse->courseType->name, 'Course type should be Earn');
    }

    /** @test */
    public function test_course_list_still_shows_earn_courses(): void
    {
        // Arrange: Create courses with different types
        $generalCourse = Course::factory()->create([
            'course_type_id' => CourseType::GENERAL_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'General Course'
        ]);

        $freeCourse = Course::factory()->create([
            'course_type_id' => CourseType::FREE_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'Free Course'
        ]);

        $earnCourse = Course::factory()->create([
            'course_type_id' => CourseType::EARN_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'Earn Course'
        ]);

        $specialCourse = Course::factory()->create([
            'course_type_id' => CourseType::SPECIAL_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'Special Course'
        ]);

        // Act: Query all courses
        $courses = Course::whereIn('id', [
            $generalCourse->id,
            $freeCourse->id,
            $earnCourse->id,
            $specialCourse->id
        ])->get();

        // Assert: All courses are returned including Earn
        $this->assertCount(4, $courses, 'Should return all 4 courses');

        $courseIds = $courses->pluck('id')->toArray();
        $this->assertContains($generalCourse->id, $courseIds, 'Should include General course');
        $this->assertContains($freeCourse->id, $courseIds, 'Should include Free course');
        $this->assertContains($earnCourse->id, $courseIds, 'Should include Earn course');
        $this->assertContains($specialCourse->id, $courseIds, 'Should include Special course');
    }

    /** @test */
    public function test_earn_courses_can_be_queried_by_type(): void
    {
        // Arrange: Create multiple Earn courses
        $earnCourse1 = Course::factory()->create([
            'course_type_id' => CourseType::EARN_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'Earn Course 1'
        ]);

        $earnCourse2 = Course::factory()->create([
            'course_type_id' => CourseType::EARN_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'Earn Course 2'
        ]);

        // Also create a non-Earn course to verify filtering
        $generalCourse = Course::factory()->create([
            'course_type_id' => CourseType::GENERAL_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'General Course'
        ]);

        // Act: Query only Earn type courses created in this test
        $earnCourses = Course::where('course_type_id', CourseType::EARN_ID)
            ->whereIn('id', [$earnCourse1->id, $earnCourse2->id, $generalCourse->id])
            ->get();

        // Assert: Only Earn courses are returned (not General)
        $this->assertCount(2, $earnCourses, 'Should return exactly 2 Earn courses');

        $earnCourseIds = $earnCourses->pluck('id')->toArray();
        $this->assertContains($earnCourse1->id, $earnCourseIds, 'Should include first Earn course');
        $this->assertContains($earnCourse2->id, $earnCourseIds, 'Should include second Earn course');
        $this->assertNotContains($generalCourse->id, $earnCourseIds, 'Should NOT include General course');
    }

    /** @test */
    public function test_earn_type_exists_in_database_for_backwards_compatibility(): void
    {
        // Act: Query the Earn type directly
        $earnType = CourseType::find(CourseType::EARN_ID);

        // Assert: Earn type exists
        $this->assertNotNull($earnType, 'Earn type should exist in database');
        $this->assertEquals(CourseType::EARN_ID, $earnType->id, 'Should have correct ID');
        $this->assertEquals(CourseType::EARN, $earnType->name, 'Should have correct name');
    }

    /** @test */
    public function test_course_with_earn_type_can_access_relationships(): void
    {
        // Arrange: Create an Earn course with relationships
        $earnCourse = Course::factory()->create([
            'course_type_id' => CourseType::EARN_ID,
            'professor_id' => $this->teacher->id,
            'title' => 'Earn Course with Relationships'
        ]);

        // Act: Load course with all relationships
        $loadedCourse = Course::with(['professor', 'courseType'])->find($earnCourse->id);

        // Assert: All relationships work properly
        $this->assertNotNull($loadedCourse->professor, 'Professor relationship should work');
        $this->assertEquals($this->teacher->id, $loadedCourse->professor->id, 'Should have correct professor');

        $this->assertNotNull($loadedCourse->courseType, 'CourseType relationship should work');
        $this->assertEquals(CourseType::EARN, $loadedCourse->courseType->name, 'Should have correct course type');
    }
}
