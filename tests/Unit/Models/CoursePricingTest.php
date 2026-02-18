<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CoursePricingTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::where('slug', 'ada-to-jpy')->delete();
        Setting::create([
            'slug'     => 'ada-to-jpy',
            'name'     => 'ADA to JPY',
            'value'    => '50',
            'type'     => 'number',
            'category' => 'general',
        ]);

        Http::fake([
            'api.coingecko.com/*' => Http::response([
                'cardano' => ['jpy' => 50.0]
            ], 200)
        ]);

        Cache::flush();
    }

    public function test_course_price_in_ada_accessor_returns_converted_value()
    {
        $course = Course::factory()->create(['price' => 5000]);

        $this->assertEquals(100.0, $course->price_in_ada);
    }

    public function test_course_price_in_ada_returns_null_when_no_price()
    {
        $course = Course::factory()->create(['price' => null]);

        $this->assertNull($course->price_in_ada);
    }

    public function test_course_price_in_ada_returns_null_when_price_is_zero()
    {
        $course = Course::factory()->create(['price' => 0]);

        $this->assertNull($course->price_in_ada);
    }

    public function test_course_application_does_not_have_price_in_ada_accessor()
    {
        $courseApplication = CourseApplication::factory()->create(['price' => 2500]);

        // The price_in_ada accessor has been removed from CourseApplication model.
        // Controllers should use ExchangeRateService::addPriceInAdaToCourses() instead.
        $this->assertNull($courseApplication->price_in_ada);
    }

    public function test_price_in_ada_not_auto_appended_to_json()
    {
        $course = Course::factory()->create(['price' => 5000]);

        $array = $course->toArray();

        $this->assertArrayNotHasKey('price_in_ada', $array);
    }
}
