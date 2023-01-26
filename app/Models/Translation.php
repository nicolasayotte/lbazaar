<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Translation extends Model
{
    use HasFactory;

    public $timestamps = false;

    public const LOCALES = [
        'en' => 'en',
        'ja' => 'ja'
    ];

}
