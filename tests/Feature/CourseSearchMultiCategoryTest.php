<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseCategory;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourseSearchMultiCategoryTest extends TestCase
{
    use DatabaseTransactions;

    /** @test */
    public function test_can_filter_courses_by_single_category()
    {
        $category = CourseCategory::factory()->create(['name' => 'Web Development']);
        $course1 = Course::factory()->create(['title' => 'Course 1']);
        $course2 = Course::factory()->create(['title' => 'Course 2']);

        $course1->categories()->attach($category->id);

        $response = $this->get(route('course.index', [
            'category_ids' => [$category->id]
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->has('courses.data', 1)
            ->where('courses.data.0.title', 'Course 1')
        );
    }

    /** @test */
    public function test_can_filter_courses_by_multiple_categories_with_and_logic()
    {
        $category1 = CourseCategory::factory()->create(['name' => 'Web Development']);
        $category2 = CourseCategory::factory()->create(['name' => 'JavaScript']);

        $course1 = Course::factory()->create(['title' => 'Full Stack Course']);
        $course2 = Course::factory()->create(['title' => 'Frontend Course']);
        $course3 = Course::factory()->create(['title' => 'Backend Course']);

        // Course 1 has both categories
        $course1->categories()->attach([$category1->id, $category2->id]);
        // Course 2 has only category1
        $course2->categories()->attach($category1->id);
        // Course 3 has only category2
        $course3->categories()->attach($category2->id);

        $response = $this->get(route('course.index', [
            'category_ids' => [$category1->id, $category2->id]
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->has('courses.data', 1)
            ->where('courses.data.0.title', 'Full Stack Course')
        );
    }

    /** @test */
    public function test_course_without_all_categories_excluded_from_results()
    {
        $category1 = CourseCategory::factory()->create(['name' => 'Web']);
        $category2 = CourseCategory::factory()->create(['name' => 'Mobile']);
        $category3 = CourseCategory::factory()->create(['name' => 'Backend']);

        $course = Course::factory()->create(['title' => 'Test Course']);
        $course->categories()->attach([$category1->id, $category2->id]);

        $response = $this->get(route('course.index', [
            'category_ids' => [$category1->id, $category2->id, $category3->id]
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->has('courses.data', 0)
        );
    }

    /** @test */
    public function test_invalid_category_id_returns_validation_error()
    {
        $response = $this->get(route('course.index', [
            'category_ids' => [99999]
        ]));

        $response->assertSessionHasErrors('category_ids.0');
    }

    /** @test */
    public function test_empty_category_ids_returns_all_courses()
    {
        Course::factory()->count(3)->create();

        $response = $this->get(route('course.index', [
            'category_ids' => []
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->where('courses.total', fn ($total) => $total >= 3)
        );
    }

    /** @test */
    public function test_null_category_ids_returns_all_courses()
    {
        Course::factory()->count(3)->create();

        $response = $this->get(route('course.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->where('courses.total', fn ($total) => $total >= 3)
        );
    }
}
