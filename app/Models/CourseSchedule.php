<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseSchedule extends Model
{
    use HasFactory;

    const COMING_SOON_COUNT_DISPLAY = 4;

    protected $appends = [
        'status',
        'total_bookings',
        'formatted_start_datetime'
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

    public function getFormattedStartDatetimeAttribute($value)
    {
        return Carbon::parse($value)->format('l M d Y h:i A');
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
        $now = Carbon::now();

        $start = Carbon::parse($this->start_datetime);
        $end = Carbon::parse($this->end_datetime);

        if ($now->lt($start) && $now->lt($end)) {
            return ucwords(Status::UPCOMING);
        }

        if ($now->gte($start) && $now->lte($end)) {
            return ucwords(Status::ONGOING);
        }

        if ($now->gt($start) && $now->gt($end)) {
            return ucwords(Status::DONE);
        }
    }

    public function getTotalBookingsAttribute()
    {
        return $this->courseHistories()->get()->count();
    }
}
