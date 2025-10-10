<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseCategory;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CourseCategoryRelationTest extends TestCase
{
    use DatabaseTransactions;

    /** @test */
    public function a_course_can_have_multiple_categories()
    {
        $course = Course::factory()->create();
        $categories = CourseCategory::factory()->count(3)->create();
        $course->categories()->sync($categories->pluck('id')->toArray());

        $this->assertCount(3, $course->categories);
        $this->assertEqualsCanonicalizing(
            $categories->pluck('id')->toArray(),
            $course->categories->pluck('id')->toArray()
        );
    }

    /** @test */
    public function a_category_can_have_multiple_courses()
    {
        $category = CourseCategory::factory()->create();
        $courses = Course::factory()->count(2)->create();
        foreach ($courses as $course) {
            $course->categories()->attach($category->id);
        }
        $this->assertCount(2, $category->courses);
        $this->assertEqualsCanonicalizing(
            $courses->pluck('id')->toArray(),
            $category->courses->pluck('id')->toArray()
        );
    }
}
