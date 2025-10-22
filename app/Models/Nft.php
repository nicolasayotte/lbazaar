<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Nft extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'mph',
        'name',
        'description',
        'points',
        'for_sale',
        'image_url'
    ];
}
