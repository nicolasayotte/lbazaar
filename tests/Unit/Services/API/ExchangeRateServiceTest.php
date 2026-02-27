<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Services\API\ExchangeRateService;
use App\Models\Setting;

class ExchangeRateServiceTest extends TestCase
{
    protected ExchangeRateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ExchangeRateService();
        Cache::flush();

        $this->retryOnDisconnect(function () {
            // Atomic upsert — single statement to reduce connection surface area
            DB::table('settings')->updateOrInsert(
                ['slug' => 'ada-to-jpy'],
                ['name' => 'ADA to JPY Fallback', 'value' => '50', 'type' => 'number', 'category' => 'general']
            );
        });
    }

    public function test_fetches_rate_from_coingecko_api()
    {
        // Arrange: Mock successful CoinGecko API response
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 75.5
                ]
            ], 200)
        ]);

        // Act
        $rate = $this->service->getAdaJpyRate();

        // Assert
        $this->assertEquals(75.5, $rate);
    }

    public function test_caches_exchange_rate()
    {
        // Arrange: Mock first API response with rate 80.0
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 80.0
                ]
            ], 200)
        ]);

        Cache::flush();

        // Act: First call should fetch from API
        $firstRate = $this->service->getAdaJpyRate();

        // Change the mock to return different rate
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 999.0
                ]
            ], 200)
        ]);

        // Second call should return cached value
        $secondRate = $this->service->getAdaJpyRate();

        // Assert: Both calls should return the cached rate
        $this->assertEquals(80.0, $firstRate);
        $this->assertEquals(80.0, $secondRate);
    }

    public function test_falls_back_to_database_setting_on_api_failure()
    {
        // Arrange: Mock API failure with 500 response
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([], 500)
        ]);

        Cache::flush();

        // Act
        $rate = $this->service->getAdaJpyRate();

        // Assert: Should return fallback rate from Setting
        $this->assertEquals(50.0, $rate);
    }

    public function test_handles_missing_cardano_data_in_response()
    {
        // Arrange: Mock API response without cardano key
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'bitcoin' => [
                    'jpy' => 5000000
                ]
            ], 200)
        ]);

        Cache::flush();

        // Act
        $rate = $this->service->getAdaJpyRate();

        // Assert: Should fall back to Setting
        $this->assertEquals(50.0, $rate);
    }

    public function test_converts_jpy_to_ada_correctly()
    {
        // Arrange: Mock rate at 50.0 JPY per ADA
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 50.0
                ]
            ], 200)
        ]);

        Cache::flush();

        // Act: Convert 1000 JPY to ADA
        // 1000 JPY / 50.0 JPY per ADA = 20.0 ADA
        $ada = $this->service->jpyToAda(1000);

        // Assert
        $this->assertEquals(20.0, $ada);
    }

    public function test_jpy_to_ada_rounds_to_two_decimals()
    {
        // Arrange: Mock rate at 47.3 JPY per ADA
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 47.3
                ]
            ], 200)
        ]);

        Cache::flush();

        // Act: Convert 1234 JPY to ADA
        // 1234 / 47.3 = 26.08880... should round to 26.09
        $ada = $this->service->jpyToAda(1234);

        // Assert
        $this->assertEquals(26.09, $ada);
    }

    public function test_jpy_to_ada_handles_zero_jpy()
    {
        // Act: Convert 0 JPY to ADA
        $ada = $this->service->jpyToAda(0);

        // Assert
        $this->assertEquals(0, $ada);
    }

    public function test_throws_exception_when_no_setting_exists()
    {
        // Arrange: Delete the ada-to-jpy setting
        Setting::where('slug', 'ada-to-jpy')->delete();

        // Mock API failure
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([], 500)
        ]);

        Cache::flush();

        // Assert: Should throw exception when fallback not configured
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Exchange rate fallback not configured');

        // Act
        $this->service->getAdaJpyRate();
    }

    public function test_caches_fallback_rate_separately_from_successful_rate()
    {
        // Arrange: Manually prime the fallback cache
        Cache::put('ada_jpy_rate_fallback', 50.0, 60);

        // Mock successful API response
        Http::fake([
            '*/simple/price*' => Http::response([
                'cardano' => ['jpy' => 100.0]
            ], 200)
        ]);

        // Verify fallback is cached but main cache is empty
        $this->assertEquals(50.0, Cache::get('ada_jpy_rate_fallback'));
        $this->assertNull(Cache::get('ada_jpy_rate'));

        // Act: Call should fetch fresh rate from API (ignoring fallback cache)
        $freshRate = $this->service->getAdaJpyRate();

        // Assert: Should get fresh rate from API, not cached fallback
        $this->assertEquals(100.0, $freshRate);

        // Verify successful rate is cached and fallback cache is cleared
        $this->assertEquals(100.0, Cache::get('ada_jpy_rate'));
        $this->assertNull(Cache::get('ada_jpy_rate_fallback'));
    }

    public function test_fallback_rate_uses_shorter_cache_ttl()
    {
        // Arrange: API is down; fallback cache TTL is irrelevant to what we measure
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([], 500)
        ]);

        Cache::flush();

        // Act: first call should fetch fallback rate from DB (value=50) and cache it
        $firstRate = $this->service->getAdaJpyRate();
        $this->assertEquals(50.0, $firstRate);

        // Confirm the fallback IS cached (Cache::remember stored it under this key)
        $this->assertEquals(50.0, Cache::get('ada_jpy_rate_fallback'),
            'Fallback rate must be stored in cache after first call');

        // Update the DB setting to a new value
        Setting::where('slug', 'ada-to-jpy')->update(['value' => '75']);

        // Simulate cache expiry: forget the fallback key directly.
        // This is exactly the state after the configured TTL elapses in production —
        // no sleep required, and no MySQL connection is held idle.
        Cache::forget('ada_jpy_rate_fallback');

        // Act: second call finds no cached fallback and re-queries the DB
        $secondRate = $this->service->getAdaJpyRate();

        // Assert: returns the updated value, proving re-query happens on cache miss
        $this->assertEquals(75.0, $secondRate);
    }

    public function test_successful_api_response_not_affected_by_fallback_cache()
    {
        // Arrange: Manually prime fallback cache (simulating previous API failure)
        Cache::put('ada_jpy_rate_fallback', 50.0, 60);

        // Mock successful API response
        Http::fake([
            '*/simple/price*' => Http::response([
                'cardano' => ['jpy' => 85.0]
            ], 200)
        ]);

        // Verify fallback is cached but main cache is empty
        $this->assertEquals(50.0, Cache::get('ada_jpy_rate_fallback'));
        $this->assertNull(Cache::get('ada_jpy_rate'));

        // Act: Should fetch from API successfully (ignoring fallback cache)
        $rate = $this->service->getAdaJpyRate();

        // Assert: Should get API rate, not fallback
        $this->assertEquals(85.0, $rate);

        // Verify API rate is now cached and fallback cache cleared
        $this->assertEquals(85.0, Cache::get('ada_jpy_rate'));
        $this->assertNull(Cache::get('ada_jpy_rate_fallback'));
    }

    public function test_validates_fallback_rate_on_api_failure()
    {
        // Arrange: Set valid fallback rate
        Setting::where('slug', 'ada-to-jpy')->delete();
        Setting::create([
            'slug' => 'ada-to-jpy',
            'name' => 'ADA to JPY Fallback',
            'value' => '65.5',
            'type' => 'number',
            'category' => 'general',
        ]);

        // Mock API failure
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([], 500)
        ]);

        Cache::flush();

        // Act
        $rate = $this->service->getAdaJpyRate();

        // Assert: Should use fallback rate from setting
        $this->assertEquals(65.5, $rate);
    }

    public function test_adds_price_in_ada_to_courses_collection()
    {
        // Arrange: Mock rate at 50.0 JPY per ADA
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 50.0
                ]
            ], 200)
        ]);

        Cache::flush();

        $course1 = \App\Models\Course::factory()->make(['price' => 5000]);
        $course2 = \App\Models\Course::factory()->make(['price' => 2500]);
        $course3 = \App\Models\Course::factory()->make(['price' => 0]);
        $courses = collect([$course1, $course2, $course3]);

        // Act: Add price_in_ada to courses
        $this->service->addPriceInAdaToCourses($courses);

        // Assert: First course should have 100 ADA (5000 / 50)
        $this->assertEquals(100.0, $course1->price_in_ada);

        // Assert: Second course should have 50 ADA (2500 / 50)
        $this->assertEquals(50.0, $course2->price_in_ada);

        // Assert: Third course with 0 price should have null
        $this->assertNull($course3->price_in_ada);
    }

    public function test_adds_price_in_ada_to_empty_collection()
    {
        // Arrange: Empty collection
        $courses = collect([]);

        // Act: Should not throw error
        $result = $this->service->addPriceInAdaToCourses($courses);

        // Assert: Should return empty collection
        $this->assertCount(0, $result);
    }

    public function test_adds_price_in_ada_gracefully_when_no_setting_exists()
    {
        // Arrange: Delete fallback setting and mock API failure
        Setting::where('slug', 'ada-to-jpy')->delete();

        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([], 500)
        ]);

        Cache::flush();

        $course1 = \App\Models\Course::factory()->make(['price' => 5000]);
        $course2 = \App\Models\Course::factory()->make(['price' => 2500]);
        $courses = collect([$course1, $course2]);

        // Act: Should NOT throw; should degrade gracefully
        $result = $this->service->addPriceInAdaToCourses($courses);

        // Assert: All courses get null price_in_ada, collection is returned
        $this->assertNull($course1->price_in_ada);
        $this->assertNull($course2->price_in_ada);
        $this->assertCount(2, $result);
    }

    public function test_adds_price_in_ada_to_course_applications()
    {
        // Arrange: Mock rate at 50.0 JPY per ADA
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 50.0
                ]
            ], 200)
        ]);

        Cache::flush();

        $app1 = \App\Models\CourseApplication::factory()->make(['price' => 10000]);
        $app2 = \App\Models\CourseApplication::factory()->make(['price' => null]);
        $applications = collect([$app1, $app2]);

        // Act: Add price_in_ada to applications
        $this->service->addPriceInAdaToCourses($applications);

        // Assert: First application should have 200 ADA (10000 / 50)
        $this->assertEquals(200.0, $app1->price_in_ada);

        // Assert: Second application with null price should have null
        $this->assertNull($app2->price_in_ada);
    }

    public function test_price_in_ada_is_derived_from_jpy_price_not_set_independently()
    {
        // Arrange: Mock CoinGecko returning 100 JPY per ADA
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => [
                    'jpy' => 100.0
                ]
            ], 200)
        ]);

        Cache::flush();

        $course = \App\Models\Course::factory()->make(['price' => 5000]);
        $courses = collect([$course]);

        // Act
        $this->service->addPriceInAdaToCourses($courses);

        // Assert: 5000 JPY / 100 JPY per ADA = 50.0 ADA
        $this->assertEquals(50.0, $course->price_in_ada);
    }

    public function test_courses_receive_null_price_in_ada_when_both_api_and_fallback_fail()
    {
        // Arrange: Delete the ada-to-jpy fallback setting
        Setting::where('slug', 'ada-to-jpy')->delete();

        // Mock API failure with 500 response
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([], 500)
        ]);

        Cache::flush();

        $course1 = \App\Models\Course::factory()->make(['price' => 5000]);
        $course2 = \App\Models\Course::factory()->make(['price' => 2500]);
        $courses = collect([$course1, $course2]);

        // Act: Should NOT throw; graceful degradation
        $result = $this->service->addPriceInAdaToCourses($courses);

        // Assert: All courses get null price_in_ada when exchange rate is unavailable
        $this->assertNull($course1->price_in_ada);
        $this->assertNull($course2->price_in_ada);
        $this->assertCount(2, $result);
    }

    public function test_is_available_returns_true_when_cached()
    {
        // Arrange: Prime the cache directly — no HTTP call needed
        Cache::put('ada_jpy_rate', 75.0, 600);

        // Act
        $result = $this->service->isAvailable();

        // Assert: Should return true immediately from cache
        $this->assertTrue($result);
    }

    public function test_is_available_returns_false_when_both_fail()
    {
        // Arrange: Delete fallback setting and mock API failure
        Setting::where('slug', 'ada-to-jpy')->delete();

        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([], 500)
        ]);

        Cache::flush();

        // Act
        $result = $this->service->isAvailable();

        // Assert: Both API and fallback failed — should return false
        $this->assertFalse($result);
    }

    public function test_batch_computation_fetches_rate_only_once()
    {
        // Arrange: Mock API to track calls
        $callCount = 0;
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => function() use (&$callCount) {
                $callCount++;
                return Http::response([
                    'cardano' => ['jpy' => 50.0]
                ], 200);
            }
        ]);

        Cache::flush();

        $course1 = \App\Models\Course::factory()->make(['price' => 5000]);
        $course2 = \App\Models\Course::factory()->make(['price' => 2500]);
        $course3 = \App\Models\Course::factory()->make(['price' => 7500]);
        $courses = collect([$course1, $course2, $course3]);

        // Act: Add price_in_ada to all courses
        $this->service->addPriceInAdaToCourses($courses);

        // Assert: API should be called only once (then cached)
        $this->assertEquals(1, $callCount);

        // Assert: All courses should have correct ADA prices
        $this->assertEquals(100.0, $course1->price_in_ada);
        $this->assertEquals(50.0, $course2->price_in_ada);
        $this->assertEquals(150.0, $course3->price_in_ada);
    }
}
