<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * PlaywrightExchangeRateFailureSeeder
 *
 * Simulates ADA exchange rate unavailability for Playwright browser tests.
 * Run before ada-conversion-failure.spec.js tests:
 *
 *   sail artisan db:seed --class=PlaywrightExchangeRateFailureSeeder
 *
 * To restore normal behaviour, re-seed the ada-to-jpy Setting manually
 * or re-run the standard PlaywrightTestSeeder.
 */
class PlaywrightExchangeRateFailureSeeder extends Seeder
{
    public function run(): void
    {
        // Remove the ada-to-jpy fallback setting so the exchange rate service
        // has no fallback and will return null price_in_ada for all courses.
        Setting::where('slug', 'ada-to-jpy')->delete();

        // Flush any cached exchange rate so the service actually attempts a
        // fresh lookup (which will fail since the external API is not mocked
        // in the Playwright environment).
        Cache::forget('ada_jpy_rate');
        Cache::forget('ada_jpy_rate_fallback');
    }
}
