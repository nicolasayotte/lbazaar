<?php

namespace Tests\Feature\Http\Controllers\API;

use Tests\TestCase;
use App\Models\Course;
use App\Services\API\ExchangeRateService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Mockery;

class CourseControllerTest extends TestCase
{
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $this->course = Course::factory()->create(['price' => 5000]);
    }

    public function test_ada_price_endpoint_is_public(): void
    {
        // Arrange: Provide a working rate so the endpoint returns available:true
        Http::fake([
            'api.coingecko.com/api/v3/simple/price*' => Http::response([
                'cardano' => ['jpy' => 50.0]
            ], 200)
        ]);

        // Act: No auth — request without any authenticated user
        $response = $this->getJson("/api/courses/{$this->course->id}/ada-price");

        // Assert: Should be 200 (public endpoint, no auth required)
        $response->assertStatus(200);
    }

    public function test_ada_price_endpoint_returns_unavailable_when_rate_fails(): void
    {
        // Arrange: Mock ExchangeRateService::isAvailable() to return false
        $mockService = Mockery::mock(ExchangeRateService::class);
        $mockService->shouldReceive('isAvailable')->once()->andReturn(false);
        $this->app->instance(ExchangeRateService::class, $mockService);

        // Act
        $response = $this->getJson("/api/courses/{$this->course->id}/ada-price");

        // Assert: Should return 200 with available:false
        $response->assertStatus(200)
            ->assertJson([
                'available' => false,
                'data'      => ['price_in_ada' => null],
            ]);
    }

    public function test_ada_price_endpoint_returns_price_when_rate_available(): void
    {
        // Arrange: Mock service to return a known ADA price
        $mockService = Mockery::mock(ExchangeRateService::class);
        $mockService->shouldReceive('isAvailable')->once()->andReturn(true);
        $mockService->shouldReceive('jpyToAda')->once()->with(5000.0)->andReturn(100.0);
        $this->app->instance(ExchangeRateService::class, $mockService);

        // Act
        $response = $this->getJson("/api/courses/{$this->course->id}/ada-price");

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'available' => true,
                'data'      => ['price_in_ada' => 100.0],
            ]);
    }

    public function test_ada_price_endpoint_returns_404_for_nonexistent_course(): void
    {
        // Act: Use an ID that doesn't exist
        $response = $this->getJson('/api/courses/999999/ada-price');

        // Assert: Laravel's model binding returns 404
        $response->assertStatus(404);
    }
}
