<?php

namespace App\Data;

use App\Models\CourseHistory;
use Carbon\Carbon;

class CourseManageStudentData
{
    private $id;

    private $studentId;

    private $fullname;

    private $bookedDate;

    private $country;

    private $isCompleted;

    private $completedAt;

    // Setters
    public function setId($id): self
    {
        $this->id = $id;

        return $this;
    }

    public function setFullname($fullname): self
    {
        $this->fullname = $fullname;

        return $this;
    }

    public function setBookedDate($bookedDate): self
    {
        $this->bookedDate = $bookedDate;

        return $this;
    }

    public function setCountry($country): self
    {
        $this->country = $country;

        return $this;
    }

    public function setIsCompleted($isCompleted): self
    {
        $this->isCompleted = $isCompleted;

        return $this;
    }

    public function setCompletedAt($completedAt): self
    {
        $this->completedAt = $completedAt;

        return $this;
    }

    public function setStudentId($studentId): self
    {
        $this->studentId = $studentId;

        return $this;
    }

    // Getters
    public function getId()
    {
        return $this->id;
    }

    public function getFullname()
    {
        return $this->fullname;
    }

    public function getBookedDate()
    {
        return $this->bookedDate;
    }

    public function getCountry()
    {
        return $this->country;
    }

    public function getIsCompleted()
    {
        return $this->isCompleted;
    }

    public function getCompletedAt()
    {
        return $this->completedAt;
    }

    public function getStudentId()
    {
        return $this->studentId;
    }

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public static function fromModel(CourseHistory $courseHistory)
    {
        $courseHistoryData = new CourseManageStudentData();
        $courseHistoryData->setId($courseHistory->id);
        $courseHistoryData->setStudentId($courseHistory->user->id);
        $courseHistoryData->setFullname($courseHistory->user->fullname);
        $courseHistoryData->setCountry($courseHistory->user->country->name);
        $courseHistoryData->setIsCompleted($courseHistory->completed_at != null);
        $courseHistoryData->setBookedDate(Carbon::parse($courseHistory->created_at)->format('M j, Y'));
        $courseHistoryData->setCompletedAt(Carbon::parse($courseHistory->completed_at)->format('M j, Y'));

        return $courseHistoryData->getProperties();
    }
}
