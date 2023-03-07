<?php

namespace App\Models;

use App\Facades\Asset;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    const FEATURED_CLASS_COUNT_DISPLAY = 8;

    const TOP_FEEDBACKS_DISPLAY_COUNT = 5;

    const PER_PAGE = 10;

    const LIVE = 'live';

    const ON_DEMAND = 'on-demand';

    protected $fillable = [
        "title",
        "description",
        "language",
        "image_thumbnail",
        "course_category_id",
        "course_type_id",
        "video_path",
        "zoom_link",
        "is_live",
        "price",
        "points_earned",
        "professor_id",
        "course_application_id",
        "max_participant",
        "is_cancellable",
        "days_before_cancellation"
    ];

    protected $appends = [
        'overall_rating',
        'format',
        'top_feedbacks'
    ];

    protected $casts = [
        'price' => 'float',
        'points_earned' => 'float'
    ];

    public function professor()
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    public function courseType()
    {
        return $this->belongsTo(CourseType::class);
    }

    public function courseCategory()
    {
        return $this->belongsTo(CourseCategory::class)->withTrashed();
    }

    public function coursePackage()
    {
        return $this->hasOneThrough(
            CoursePackage::class,
            CoursePackageCourse::class,
            'course_id',
            'id',
            'id',
            'course_package_id'
        );
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function schedules()
    {
        return $this->hasMany(CourseSchedule::class);
    }

    public function contents()
    {
        return $this->hasMany(CourseContent::class);
    }

    public function students()
    {
        return $this->hasManyThrough(
            User::class,
            CourseHistory::class,
            'course_id',
            'id',
            'id',
            'user_id'
        );
    }

    public function feedbacks()
    {
        return $this->hasMany(CourseFeedback::class)->orderBy('created_at', 'desc');
    }

    public function exams()
    {
        return $this->hasMany(Exam::class, 'course_id');
    }

    public function getPriceAttribute($value) {
        if (@$value) {
            return number_format($value, 2);
        }
    }

    public function getOverallRatingAttribute()
    {
        $feedbacks = $this->feedbacks()->get();

        $totalRating = 0;
        $overallRating = 0;

        if ($feedbacks->count() > 0) {
            foreach ($feedbacks as $feedback) {
                $totalRating += floatval($feedback->rating);
            }

            $overallRating = $totalRating / $feedbacks->count();
        }

        return $overallRating;
    }

    public function getImageThumbnailAttribute($path)
    {
        return @$path ? Asset::get($path) : null;
    }

    public function getVideoPathAttribute($path)
    {
        return @$path ? Asset::get($path) : null;
    }

    public function getFormatAttribute()
    {
        return ucwords($this->is_live ? self::LIVE : self::ON_DEMAND , '-');
    }

    public function getTopFeedbacksAttribute()
    {
        return $this->feedbacks()
                    ->with('user')
                    ->limit(self::TOP_FEEDBACKS_DISPLAY_COUNT)
                    ->orderBy('rating', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->get();
    }
}
