<?php

namespace App\Data;

use App\Models\CourseHistory;
use App\Models\Status;
use App\Models\User;
use Carbon\Carbon;

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
        $userData = new CourseHistoryData();

        $userData->setId($courseHistory->course->id);
        $userData->setTeacher($courseHistory->course->professor->fullname);
        $userData->setTitle($courseHistory->course->title);
        $userData->setType($courseHistory->course->courseType->name);
        $userData->setCategory($courseHistory->course->courseCategory->name);
        $userData->setLanguage($courseHistory->course->language);
        $userData->setStatus($courseHistory->completed_at != null ? CourseHistory::COMPLETED : CourseHistory::ONGOING);
        $userData->setBookedDate($courseHistory->created_at->format('Y-m-d H:i'));
       
        return $userData->convertToArray();
    }

    private function convertToArray()
    {
        $objectArray = [];

        foreach ($this as $key => $value) {
            $objectArray[$key] = $value;
        }

        return $objectArray;
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
