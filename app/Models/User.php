<?php

namespace App\Models;

use App\Mail\ResetPassword;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use Laratrust\Traits\LaratrustUserTrait;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable implements MustVerifyEmail
{
    use LaratrustUserTrait;
    use  HasApiTokens, HasFactory, Notifiable;

    const FEATURED_TEACHERS_COUNT_DISPLAY = 5;

    public const ACTIVE = 'active';

    public const DISABLED = 'disabled';

    public const RANDOM_PASSWORD_STRING_LENGTH = 8;

    protected $appends = ['fullname'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'country_id',
        'password',
        'is_enabled',
        'is_temp_password',
        'classification_id'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function getFullnameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function sendPasswordResetNotification($token)
    {
        $url = route('password.reset', ['token' => $token, 'email' => $this->email]);

        Mail::send( New ResetPassword($this->email, $url));
    }

    public function courseHistories()
    {
        return $this->hasMany(CourseHistory::class);
    }

    public function classification()
    {
        return $this->belongsTo(Classifications::class, 'classification_id')->withTrashed();
    }

    public function feedbacks()
    {
        return $this->hasMany(CourseFeedback::class);
    }

    public function courses()
    {
        return $this->hasManyThrough(
            Course::class,
            CourseHistory::class,
            'user_id',
            'id',
            'id',
            'course_id'
        );
    }

    public function isCourseBooked($class_id)
    {
        return $this->courses->where('id', $class_id)->count() > 0;
    }

    public function hasFeedback($class_id)
    {
        return $this->feedbacks->where('course_id', $class_id)->count() > 0;
    }

    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }
}
