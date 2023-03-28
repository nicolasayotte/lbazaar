<?php

namespace App\Models;

use App\Mail\ResetPassword;
use App\Models\Role;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use Laratrust\Traits\LaratrustUserTrait;
use Laravel\Sanctum\HasApiTokens;
use App\Facades\Asset;

class User extends Authenticatable implements MustVerifyEmail
{
    use LaratrustUserTrait;
    use  HasApiTokens, HasFactory, Notifiable;

    const FEATURED_TEACHERS_COUNT_DISPLAY = 5;

    public const ACTIVE = 'active';

    public const DISABLED = 'disabled';

    public const RANDOM_PASSWORD_STRING_LENGTH = 8;

    public const COMMISSION = [
        Role::ADMIN => 20,
        Role::TEACHER => 80,
    ];

    public const EXPORT_OPTIONS_CLASS_HISTORY_ID = 0;

    public const EXPORT_OPTIONS_TEACHING_HISTORY_ID = 1;

    public const EXPORT_OPTIONS_BADGES_HISTORY_ID = 2;

    public const EXPORT_OPTIONS_WALLET_TRANSACTION_ID = 3;

    public const EXPORT_OPTIONS = [
       ['id' => self::EXPORT_OPTIONS_CLASS_HISTORY_ID , 'name' => 'Class History'],
       ['id' => self::EXPORT_OPTIONS_TEACHING_HISTORY_ID , 'name' => 'Teaching History'],
       ['id' => self::EXPORT_OPTIONS_BADGES_HISTORY_ID , 'name' => 'Badges'],
       ['id' => self::EXPORT_OPTIONS_WALLET_TRANSACTION_ID , 'name' => 'Wallet Transactions'],
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'image',
        'email',
        'about',
        'specialty',
        'commission_rate',
        'commission_earn_rate',
        'country_id',
        'password',
        'is_enabled',
        'is_temp_password',
        'classification_id',
        'university',
        'email_verified_at'
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

    /**
     * The attributes that should be appended.
     *
     * @var array<string, string>
     */
    protected $appends = [
        'fullname',
        'completed_schedules'
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

    public function createdCourses()
    {
        return $this->hasMany(Course::class, 'professor_id', 'id');
    }

    public function userCertification()
    {
        return $this->hasMany(UserCertification::class, 'user_id', 'id');
    }

    public function userEducation()
    {
        return $this->hasMany(UserEducation::class, 'user_id', 'id');
    }

    public function userWorkHistory()
    {
        return $this->hasMany(UserWorkHistory::class, 'user_id', 'id');
    }

    public function userWallet()
    {
        return $this->hasOne(UserWallet::class, 'user_id', 'id');
    }

    public function isCourseBooked($class_id)
    {
        return $this->courses->where('id', $class_id)->count() > 0;
    }

    public function isCourseScheduleBooked($class_schedule_id)
    {
        return $this->schedules->where('id', $class_schedule_id)->count() > 0;
    }

    public function hasFeedback($class_id)
    {
        return $this->feedbacks->where('course_id', $class_id)->count() > 0;
    }

    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }

    public function exams()
    {
        return $this->hasMany(UserExam::class);
    }

    public function schedules()
    {
        return $this->hasManyThrough(
            CourseSchedule::class,
            CourseHistory::class,
            'user_id',
            'id',
            'id',
            'course_schedule_id'
        );
    }

    public function teacherSchedules()
    {
        return $this->hasMany(CourseSchedule::class, 'user_id', 'id');
    }

    public function badges()
    {
        return $this->hasMany(UserBadge::class);
    }

    public function getImageAttribute($path)
    {
        return @$path ? Asset::get($path) : null;
    }

    public function getCompletedSchedulesAttribute()
    {
        return $this->courseHistories()->where('completed_at', '!=', NULL)->pluck('course_schedule_id');
    }
}
