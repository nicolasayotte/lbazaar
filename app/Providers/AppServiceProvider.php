<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Validator;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //Add this custom validation rule.
        Validator::extend('alpha_spaces', function ($attribute, $value) {
            // This will only accept alpha and spaces.
            // If you want to accept hyphens use: /^[\pL\s-]+$/u.
            return preg_match('/^[\pL\s]+$/u', $value);
        });

        // Validate critical exchange rate setting in production
        if (app()->environment('production', 'staging')) {
            $this->validateExchangeRateFallback();
        }
    }

    /**
     * Validate that exchange rate fallback setting exists and is reasonable.
     */
    protected function validateExchangeRateFallback(): void
    {
        try {
            $setting = \App\Models\Setting::where('slug', 'ada-to-jpy')->first();

            if (!$setting) {
                \Illuminate\Support\Facades\Log::warning(
                    'Exchange rate fallback not configured. Run: php artisan db:seed --class=ExchangeRateSettingSeeder'
                );
            } elseif (floatval($setting->value) <= 0 || floatval($setting->value) > 1000) {
                \Illuminate\Support\Facades\Log::warning(
                    'Exchange rate fallback value is suspicious: ' . $setting->value . '. Expected range: 10-500 JPY per ADA.'
                );
            }
        } catch (\Exception $e) {
            // Don't crash the app if settings table doesn't exist yet
            \Illuminate\Support\Facades\Log::debug('Could not validate exchange rate fallback: ' . $e->getMessage());
        }
    }
}
