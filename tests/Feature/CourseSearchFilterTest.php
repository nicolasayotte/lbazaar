<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\User;
use App\Repositories\CourseRepository;
use Illuminate\Http\Request;
use Tests\TestCase;

class CourseSearchFilterTest extends TestCase
{
    protected CourseRepository $courseRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->courseRepository = new CourseRepository();
    }

    /** @test */
    public function it_filters_courses_by_single_category()
    {
        // Create categories
        $category1 = CourseCategory::factory()->create(['name' => 'Programming']);
        $category2 = CourseCategory::factory()->create(['name' => 'Design']);

        // Create courses with different categories
        $course1 = Course::factory()->create(['title' => 'PHP Course']);
        $course1->categories()->attach($category1->id);

        $course2 = Course::factory()->create(['title' => 'React Course']);
        $course2->categories()->attach($category2->id);

        // Search with single category
        $request = new Request(['category_ids' => [$category1->id]]);
        $results = $this->courseRepository->search($request);

        $this->assertCount(1, $results);
        $this->assertEquals('PHP Course', $results->first()->title);
    }

    /** @test */
    public function it_filters_courses_by_multiple_categories_with_and_logic()
    {
        // Create categories
        $categoryProgramming = CourseCategory::factory()->create(['name' => 'Programming']);
        $categoryWeb = CourseCategory::factory()->create(['name' => 'Web Development']);
        $categoryMobile = CourseCategory::factory()->create(['name' => 'Mobile']);

        // Course with both Programming AND Web Development
        $course1 = Course::factory()->create(['title' => 'Full Stack Course']);
        $course1->categories()->attach([$categoryProgramming->id, $categoryWeb->id]);

        // Course with only Programming
        $course2 = Course::factory()->create(['title' => 'Java Course']);
        $course2->categories()->attach($categoryProgramming->id);

        // Course with Programming, Web Development AND Mobile
        $course3 = Course::factory()->create(['title' => 'React Native Course']);
        $course3->categories()->attach([$categoryProgramming->id, $categoryWeb->id, $categoryMobile->id]);

        // Search for courses that have BOTH Programming AND Web Development
        $request = new Request(['category_ids' => [$categoryProgramming->id, $categoryWeb->id]]);
        $results = $this->courseRepository->search($request);

        // Should return 2 courses: Full Stack Course and React Native Course
        $this->assertCount(2, $results);
        $titles = $results->pluck('title')->toArray();
        $this->assertContains('Full Stack Course', $titles);
        $this->assertContains('React Native Course', $titles);
        $this->assertNotContains('Java Course', $titles); // Java Course only has Programming
    }

    /** @test */
    public function it_returns_empty_when_no_courses_match_all_categories()
    {
        // Create categories
        $category1 = CourseCategory::factory()->create(['name' => 'Programming']);
        $category2 = CourseCategory::factory()->create(['name' => 'Design']);
        $category3 = CourseCategory::factory()->create(['name' => 'Marketing']);

        // Course with only Programming and Design
        $course1 = Course::factory()->create(['title' => 'Web Design Course']);
        $course1->categories()->attach([$category1->id, $category2->id]);

        // Search for Programming AND Design AND Marketing (course1 doesn't have Marketing)
        $request = new Request(['category_ids' => [$category1->id, $category2->id, $category3->id]]);
        $results = $this->courseRepository->search($request);

        $this->assertCount(0, $results);
    }

    /** @test */
    public function it_does_not_filter_when_category_ids_is_not_provided()
    {
        // Create category
        $category = CourseCategory::factory()->create(['name' => 'Programming']);

        // Create courses - one with category, one without
        $courseWithCategory = Course::factory()->create(['title' => 'Categorized Course']);
        $courseWithCategory->categories()->attach($category->id);

        $courseWithoutCategory = Course::factory()->create(['title' => 'Uncategorized Course']);

        // Search without category_ids parameter (not filled)
        $request = new Request([]);
        $results = $this->courseRepository->search($request);

        // Should return both courses (no filtering applied)
        $this->assertGreaterThanOrEqual(2, $results->total());
    }

    /** @test */
    public function it_combines_category_filter_with_other_filters()
    {
        // Create user (professor)
        $professor = $this->createTestUser();

        // Create categories
        $categoryProgramming = CourseCategory::factory()->create(['name' => 'Programming']);
        $categoryWeb = CourseCategory::factory()->create(['name' => 'Web']);

        // Course by professor with both categories
        $course1 = Course::factory()->create([
            'title' => 'PHP Web Development',
            'professor_id' => $professor->id
        ]);
        $course1->categories()->attach([$categoryProgramming->id, $categoryWeb->id]);

        // Course by different professor with both categories
        $course2 = Course::factory()->create([
            'title' => 'Python Web Development',
        ]);
        $course2->categories()->attach([$categoryProgramming->id, $categoryWeb->id]);

        // Search with category AND professor filter
        $request = new Request([
            'category_ids' => [$categoryProgramming->id, $categoryWeb->id],
            'professor_id' => $professor->id
        ]);
        $results = $this->courseRepository->search($request);

        $this->assertCount(1, $results);
        $this->assertEquals('PHP Web Development', $results->first()->title);
    }
}
