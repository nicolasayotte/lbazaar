<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExchangeRateSettingSeeder extends Seeder
{
    /**
     * Seed exchange rate fallback setting.
     *
     * This seeder creates the ada-to-jpy setting used as a fallback
     * when CoinGecko API is unavailable. This setting is CRITICAL
     * for price calculations and must be configured before production use.
     *
     * IMPORTANT: Update this value regularly to match current market rates.
     * As of 2026-02-17, ADA to JPY rate is approximately 50-70.
     *
     * @return void
     */
    public function run()
    {
        // Check if setting already exists
        $existing = DB::table('settings')->where('slug', 'ada-to-jpy')->first();

        if ($existing) {
            // Update existing setting (preserves custom values)
            DB::table('settings')
                ->where('slug', 'ada-to-jpy')
                ->update([
                    'name' => 'ADA to JPY Exchange Rate (Fallback)',
                    'type' => 'number',
                    'category' => 'general',
                    'updated_at' => now(),
                ]);
        } else {
            // Create new setting with default fallback rate
            DB::table('settings')->insert([
                'name' => 'ADA to JPY Exchange Rate (Fallback)',
                'slug' => 'ada-to-jpy',
                'type' => 'number',
                'value' => config('services.coingecko.fallback_rate', '50'),
                'category' => 'general',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
