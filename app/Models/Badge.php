<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    use HasFactory;

    public const COMPLETION = 'Certificate of Completion';

    protected $fillable = [
        'name',
        'type',
    ];
}
