<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'awarded_at',
        'awarded_by',
        'user_id',
    ];
}
