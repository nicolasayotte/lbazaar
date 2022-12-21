<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

class RoutesGenerator extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'routes:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates a json file containing all the routes';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $routes = Route::getRoutes()->getRoutesByName();

        $data = [];

        foreach ($routes as $routeName => $route) {
            $data[$routeName] = $route->uri();
        }

        File::put('resources/js/routes.json', json_encode($data, JSON_PRETTY_PRINT));
    }
}
