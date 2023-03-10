<?php

namespace App\Providers;

use App\Classes\Discord;
use Illuminate\Support\ServiceProvider;

class DiscordServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind('discord', function($app) {
            return new Discord;
        });
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
