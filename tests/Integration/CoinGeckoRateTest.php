<?php

namespace Tests\Integration;

use App\Services\API\ExchangeRateService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tests\Traits\InteractsWithRealServices;

class CoinGeckoRateTest extends TestCase
{
    use InteractsWithRealServices;

    protected function requiredServiceKeys(): array
    {
        // CoinGecko free tier requires no API key
        return [];
    }

    protected function setUp(): void
    {
        parent::setUp();

        if (empty(config('services.coingecko.api_url'))) {
            $this->markTestSkipped('CoinGecko API URL not configured.');
        }
    }

    /** @test */
    public function coingecko_returns_valid_ada_jpy_rate()
    {
        $apiUrl = config('services.coingecko.api_url');

        $response = Http::timeout(10)
            ->withHeaders(['User-Agent' => 'LeBazaar/1.0'])
            ->get("{$apiUrl}/simple/price", [
                'ids'           => 'cardano',
                'vs_currencies' => 'jpy',
            ]);

        // CoinGecko free tier may rate-limit (403/429) — skip rather than fail
        if (in_array($response->status(), [403, 429])) {
            $this->markTestSkipped('CoinGecko rate-limited — skipping.');
        }

        $this->assertTrue($response->successful());

        $data = $response->json();
        $this->assertArrayHasKey('cardano', $data);
        $this->assertArrayHasKey('jpy', $data['cardano']);

        $rate = $data['cardano']['jpy'];
        $this->assertIsNumeric($rate);
        $this->assertGreaterThan(1, $rate);
        $this->assertLessThan(10000, $rate);
    }

    /** @test */
    public function exchange_rate_service_returns_positive_rate_with_or_without_coingecko()
    {
        // Passes whether CoinGecko responds or falls back to the DB settings table.
        // For raw API connectivity see coingecko_returns_valid_ada_jpy_rate().
        Cache::forget('ada_jpy_rate');
        Cache::forget('ada_jpy_rate_fallback');

        $service = new ExchangeRateService();
        $rate = $service->getAdaJpyRate();

        $this->assertIsFloat($rate);
        $this->assertGreaterThan(0, $rate);
    }
}
