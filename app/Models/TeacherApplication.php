<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'vote_id',
        'first_name',
        'last_name',
        'email',
        'data'
    ];

    protected $with = [
        'vote'
    ];

    public function vote()
    {
        return $this->belongsTo(Vote::class);
    }
}
