<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\CourseType;
use App\Models\Setting;

class CoursePricingTest extends TestCase
{
    use DatabaseTransactions;

    protected User $teacher;
    protected CourseType $courseType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create();
        $this->teacher->attachRole('teacher');

        $this->courseType = CourseType::firstOrCreate(['name' => 'general', 'type' => 'general']);
    }

    public function test_course_api_returns_both_jpy_and_ada_prices()
    {
        // Arrange: Create setting for fallback
        Setting::updateOrCreate(
            ['slug' => 'ada-to-jpy'],
            ['name' => 'ADA to JPY Fallback', 'value' => '50', 'type' => 'number', 'category' => 'general']
        );

        // Mock CoinGecko API response with rate 50.0
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 50.0
                ]
            ], 200)
        ]);

        Cache::flush();

        // Create a course with price 5000 JPY
        $course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
            'course_type_id' => $this->courseType->id,
            'price' => 5000
        ]);

        // Act: Make GET request to course details page
        $response = $this->get(route('course.details', ['id' => $course->id]));

        // Assert: Response is successful
        $response->assertStatus(200);

        // Assert: Response contains course with price_in_ada equal to 100.0
        // 5000 JPY / 50.0 JPY per ADA = 100.0 ADA
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->has('course')
            ->where('course.price_in_ada', 100)
        );
    }

    public function test_course_creation_accepts_jpy_price()
    {
        // Arrange: Create setting for fallback
        Setting::updateOrCreate(
            ['slug' => 'ada-to-jpy'],
            ['name' => 'ADA to JPY Fallback', 'value' => '50', 'type' => 'number', 'category' => 'general']
        );

        // Mock CoinGecko API response
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 50.0
                ]
            ], 200)
        ]);

        Cache::flush();

        // Act as a teacher user
        $this->actingAs($this->teacher);

        // Act: POST to course application store route with JPY price of 5000
        $response = $this->post(route('mypage.course.applications.store'), [
            'title' => 'Test Course with JPY Price',
            'type' => 'general',
            'format' => Course::LIVE,
            'category' => 'Test Category',
            'nft_name' => null,
            'lecture_frequency' => 'weekly',
            'length' => '4 weeks',
            'price' => 5000,
            'seats' => 10,
            'description' => 'Test description'
        ]);

        // Assert: Course application was created with price 5000
        $this->assertDatabaseHas('course_applications', [
            'title' => 'Test Course with JPY Price',
            'professor_id' => $this->teacher->id,
            'price' => 5000
        ]);

        // Assert: Response redirects (successful creation)
        $response->assertRedirect(route('mypage.course.applications.index'));
        $response->assertSessionHas('success');
    }
}
