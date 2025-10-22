<?php

namespace App\Data;

use App\Models\CourseHistory;
use App\Models\UserBadge;
use Illuminate\Support\Facades\Auth;

class CourseHistoryData
{
    private $id;

    private $title;

    private $type;

    private $categories = [];

    private $teacher;

    private $status;

    private $booked_date;

    private $language;

    private $hasFeedback;

    private $isPackage;

    private $hasBadge;

    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    public function setCategories($categories)
    {
        $this->categories = $categories;
        return $this;
    }

    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    public function setLanguage($language)
    {
        $this->language = $language;

        return $this;
    }

    public function setTitle($title)
    {
        $this->title = $title;

        return $this;
    }

    public function setTeacher($teacher)
    {
        $this->teacher = $teacher;

        return $this;
    }

    public function setHasFeedback($hasFeedback)
    {
        $this->hasFeedback = $hasFeedback;

        return $this;
    }

    public function setIsPackage($isPackage)
    {
        $this->isPackage = $isPackage;

        return $this;
    }

    public function setHasBadge($hasBadge)
    {
        $this->hasBadge = $hasBadge;

        return $this;
    }

    public function setStatus($status)
    {
        $this->status = $status;

        return $this;
    }

    public function setBookedDate($booked_date)
    {
        $this->booked_date = $booked_date;

        return $this;
    }

    public function getTitle()
    {
        return $this->title;
    }

    public function getTeacher()
    {
        return $this->teacher;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getBookedDate()
    {
        return $this->booked_date;
    }

    public function getLanguage()
    {
        return $this->language;
    }

    public function getId()
    {
        return $this->id;
    }

    public function getType()
    {
        return $this->type;
    }

    public function getCategories()
    {
        return $this->categories;
    }

    public function getHasFeedback()
    {
        return $this->hasFeedback;
    }

    public function getIsPackage()
    {
        return $this->isPackage;
    }

    public function getHasBadge()
    {
        return $this->hasBadge;
    }

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public static function fromModel(CourseHistory $courseHistory)
    {
        $courseHistoryData = new CourseHistoryData();
        $courseHistoryData->setId($courseHistory->course->id);
        $courseHistoryData->setTeacher($courseHistory->course->professor->fullname);
        $courseHistoryData->setTitle($courseHistory->course->title);
        $courseHistoryData->setType($courseHistory->course->courseType->name);
        // Set categories as array of names
        $categoryNames = $courseHistory->course->categories->pluck('name')->toArray();
        $courseHistoryData->setCategories($categoryNames);
        $courseHistoryData->setLanguage($courseHistory->course->language);
        $courseHistoryData->setStatus($courseHistory->completed_at != null ? CourseHistory::COMPLETED : CourseHistory::ONGOING);
        $courseHistoryData->setBookedDate($courseHistory->created_at);
        $courseHistoryData->setHasFeedback(Auth::user()->hasFeedback($courseHistory->course->id));
        if ($courseHistory->course->coursePackage && $courseHistory->course->coursePackage->id != null) {
            $courseHistoryData->setIsPackage(true);
            $badge = UserBadge::where('course_package_id', $courseHistory->course->coursePackage->first()->id)->first();
        } else {
            $badge = UserBadge::where('course_history_id', $courseHistory->id)->first();
            $courseHistoryData->setIsPackage(false);
        }

        if($badge != null) {
            $courseHistoryData->setHasBadge(true);
        } else {
            $courseHistoryData->setHasBadge(false);
        }

        return $courseHistoryData->getProperties();
    }
}
