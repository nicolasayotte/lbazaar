<?php

namespace App\Models;

use Carbon\Carbon;
use DateTime;
use DateTimeZone;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseSchedule extends Model
{
    use HasFactory;

    const COMING_SOON_COUNT_DISPLAY = 4;

    protected $fillable = [
        'start_datetime',
        'end_datetime',
        'max_participant',
        'is_completed'
    ];

    protected $appends = [
        'status',
        'total_bookings',
        'formatted_start_datetime',
        'simple_start_datetime',
        'is_deletable',
        'is_cancellable'
    ];

    public function professor()
    {
        return $this->hasOneThrough(User::class, Course::class, 'id', 'id', 'course_id', 'professor_id');
    }

    public function courseType()
    {
        return $this->hasOneThrough(CourseType::class, Course::class, 'id', 'id', 'course_id', 'course_type_id');
    }

    public function courseCategory()
    {
        return $this->hasOneThrough(CourseCategory::class, Course::class, 'id', 'id', 'course_id', 'course_category_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function courseHistory()
    {
        return $this->hasMany(CourseHistory::class);
    }

    public function getFormattedStartDatetimeAttribute()
    {
        return Carbon::parse($this->start_datetime, 'Asia/Tokyo')->format('l M d Y h:i A');
    }

    public function getSimpleStartDatetimeAttribute()
    {
        return Carbon::parse($this->start_datetime)->format('M d, Y \a\t\ h:i A');
    }

    public function courseHistories()
    {
        return $this->hasMany(CourseHistory::class);
    }

    public function students()
    {
        return $this->hasManyThrough(
            User::class,
            CourseHistory::class,
            'course_schedule_id',
            'id',
            'id',
            'id'
        );
    }

    public function getStatusAttribute()
    {
        $timezone = new DateTimeZone(env('APP_TIMEZONE'));

        $now = Carbon::parse(new DateTime('now', $timezone));

        $start = Carbon::parse(new DateTime($this->start_datetime, $timezone));

        $end = Carbon::parse(new DateTime($this->end_datetime, $timezone));

        if ($now->gt($end) || $this->is_completed) return ucwords(Status::DONE);

        if ($now->gt($start) && $now->lt($end)) return ucwords(Status::ONGOING);

        if ($now->lt($start)) return ucwords(Status::UPCOMING);
    }

    public function getTotalBookingsAttribute()
    {
        return $this->courseHistories()
                    ->where('is_cancelled', null)
                    ->orWhere('is_cancelled', 0)
                    ->get()
                    ->count();
    }

    public function getIsDeletableAttribute()
    {
        return $this->status == ucwords(Status::UPCOMING) && $this->getTotalBookingsAttribute() <= 0;
    }

    public function getIsCancellableAttribute()
    {
        $course = $this->course()->first();

        $timezone = new DateTimeZone(env('APP_TIMEZONE'));

        $now = Carbon::parse(new DateTime('now', $timezone));

        $start = Carbon::parse(new DateTime($this->start_datetime, $timezone));

        if (!$course->is_cancellable) return false;

        return $now->addDays($course->days_before_cancellation)->gt($start) ? false : true;
    }
}
