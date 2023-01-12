<?php

namespace App\Data;

use App\Models\CourseHistory;

class CourseHistoryData
{
    private $id;

    private $title;

    private $type;

    private $category;

    private $teacher;

    private $status;

    private $booked_date;

    private $language;

    public static function fromModel(CourseHistory $courseHistory)
    {
        $courseHistoryData = new CourseHistoryData();

        $courseHistoryData->setId($courseHistory->course->id);
        $courseHistoryData->setTeacher($courseHistory->course->professor->fullname);
        $courseHistoryData->setTitle($courseHistory->course->title);
        $courseHistoryData->setType($courseHistory->course->courseType->name);
        $courseHistoryData->setCategory($courseHistory->course->courseCategory->name);
        $courseHistoryData->setLanguage($courseHistory->course->language);
        $courseHistoryData->setStatus($courseHistory->completed_at != null ? CourseHistory::COMPLETED : CourseHistory::ONGOING);
        $courseHistoryData->setBookedDate($courseHistory->created_at->format('Y-m-d H:i'));
       
        return $courseHistoryData->getProperties();
    }

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public function getId()
    {
        return $this->id;
    }

    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    public function getTitle()
    {
        return $this->title;
    }

    public function setTitle($title)
    {
        $this->title = $title;

        return $this;
    }

    public function getTeacher()
    {
        return $this->teacher;
    }

    public function setTeacher($teacher)
    {
        $this->teacher = $teacher;

        return $this;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function setStatus($status)
    {
        $this->status = $status;

        return $this;
    }

    public function getBookedDate()
    {
        return $this->booked_date;
    }

    public function setBookedDate($booked_date)
    {
        $this->booked_date = $booked_date;

        return $this;
    }

    public function getLanguage()
    {
        return $this->language;
    }

    public function setLanguage($language)
    {
        $this->language = $language;

        return $this;
    }

    public function getType()
    {
        return $this->type;
    }

    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    public function getCategory()
    {
        return $this->category;
    }

    public function setCategory($category)
    {
        $this->category = $category;

        return $this;
    }
}
