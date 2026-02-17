<?php

namespace App\Services\API;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class ExchangeRateService
{
    /**
     * Get current ADA to JPY exchange rate from CoinGecko.
     * Returns rate cached for configurable TTL (default 600 seconds).
     * Falls back to database setting with shorter cache TTL on API failure.
     */
    public function getAdaJpyRate(): float
    {
        $cacheKey = 'ada_jpy_rate';
        $successCacheTtl = config('services.coingecko.cache_ttl', 600);

        // Try to get cached successful rate first
        $cachedRate = Cache::get($cacheKey);
        if ($cachedRate !== null) {
            return $cachedRate;
        }

        // Attempt to fetch fresh rate from API
        try {
            $apiUrl = config('services.coingecko.api_url', 'https://api.coingecko.com/api/v3');
            $response = Http::timeout(10)->get("{$apiUrl}/simple/price", [
                'ids' => 'cardano',
                'vs_currencies' => 'jpy'
            ]);

            if (!$response->successful()) {
                Log::error('CoinGecko API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return $this->getCachedFallbackRate();
            }

            $data = $response->json();
            $rate = $data['cardano']['jpy'] ?? null;

            if (!$rate || $rate <= 0) {
                Log::error('Invalid exchange rate received from CoinGecko', ['data' => $data]);
                return $this->getCachedFallbackRate();
            }

            Log::info('Exchange rate fetched from CoinGecko', ['rate' => $rate]);
            $floatRate = floatval($rate);

            // Cache successful API response for full TTL
            Cache::put($cacheKey, $floatRate, $successCacheTtl);

            // Clear fallback cache on successful API response
            Cache::forget('ada_jpy_rate_fallback');

            return $floatRate;

        } catch (Exception $e) {
            Log::error('Exchange rate fetch failed', [
                'error' => $e->getMessage(),
            ]);
            return $this->getCachedFallbackRate();
        }
    }

    /**
     * Convert JPY amount to ADA equivalent.
     */
    public function jpyToAda(float $jpy): float
    {
        $rate = $this->getAdaJpyRate();

        if ($rate <= 0) {
            return 0;
        }

        return round($jpy / $rate, 2);
    }

    /**
     * Add price_in_ada attribute to courses in a collection.
     * Fetches exchange rate once and applies to all courses.
     *
     * @param iterable $courses Collection of Course or CourseApplication models
     * @return iterable Same collection with price_in_ada added
     */
    public function addPriceInAdaToCourses(iterable $courses): iterable
    {
        try {
            $rate = $this->getAdaJpyRate();
        } catch (\Throwable $e) {
            Log::critical('Exchange rate unavailable; price_in_ada will be null for all courses', [
                'error' => $e->getMessage(),
            ]);
            foreach ($courses as $course) {
                $course->price_in_ada = null;
            }
            return $courses;
        }

        foreach ($courses as $course) {
            $rawPrice = $course->price ?? null;

            if (!$rawPrice || $rawPrice <= 0 || $rate <= 0) {
                $course->price_in_ada = null;
            } else {
                $course->price_in_ada = round(floatval($rawPrice) / $rate, 2);
            }
        }

        return $courses;
    }

    /**
     * Get fallback rate from settings table with shorter cache TTL.
     * Uses separate cache key to avoid locking successful API rates.
     *
     * @throws Exception if no fallback rate is configured
     */
    protected function getCachedFallbackRate(): float
    {
        $fallbackCacheKey = 'ada_jpy_rate_fallback';
        $fallbackCacheTtl = config('services.coingecko.fallback_cache_ttl', 60);

        return Cache::remember($fallbackCacheKey, $fallbackCacheTtl, function () {
            return $this->getFallbackRate();
        });
    }

    /**
     * Get fallback rate from settings table when CoinGecko API is unavailable.
     *
     * @throws Exception if no fallback rate is configured
     */
    protected function getFallbackRate(): float
    {
        $setting = \App\Models\Setting::where('slug', 'ada-to-jpy')->first();

        if (!$setting) {
            Log::critical('No fallback exchange rate configured in settings');
            throw new Exception(
                'Exchange rate fallback not configured. Run: php artisan db:seed --class=ExchangeRateSettingSeeder'
            );
        }

        return floatval($setting->value);
    }
}
