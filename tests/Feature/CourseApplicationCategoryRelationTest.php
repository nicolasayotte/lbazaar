<?php

namespace Tests\Feature;

use App\Models\CourseApplication;
use App\Models\CourseCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseApplicationCategoryRelationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function a_course_application_can_have_multiple_categories()
    {
        $application = CourseApplication::factory()->create();
        $categories = CourseCategory::factory()->count(2)->create();
        $application->categories()->sync($categories->pluck('id')->toArray());

        $this->assertCount(2, $application->categories);
        $this->assertEqualsCanonicalizing(
            $categories->pluck('id')->toArray(),
            $application->categories->pluck('id')->toArray()
        );
    }

    /** @test */
    public function a_category_can_have_multiple_course_applications()
    {
        $category = CourseCategory::factory()->create();
        $applications = CourseApplication::factory()->count(2)->create();
        foreach ($applications as $application) {
            $application->categories()->attach($category->id);
        }
        $this->assertCount(2, $category->courseApplications);
        $this->assertEqualsCanonicalizing(
            $applications->pluck('id')->toArray(),
            $category->courseApplications->pluck('id')->toArray()
        );
    }
}
