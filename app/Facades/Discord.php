<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

class Discord extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'discord';
    }
}
