<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'subject',
        'message'
    ];

    protected $appends = [
        'created_at_string'
    ];

    public function getCreatedAtStringAttribute()
    {
        return Carbon::parse($this->created_at)->format('Y-m-d');
    }
}
