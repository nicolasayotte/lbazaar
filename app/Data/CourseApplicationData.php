<?php

namespace App\Data;

use App\Models\Course;
use App\Models\CourseApplication;
use Carbon\Carbon;

class CourseApplicationData
{
    private $id;

    private $title;

    private $professor;

    private $type;

    private $category;

    private $price;

    private $created_at;

    private $status;

    // Setters
    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    public function setTitle($title)
    {
        $this->title = $title;

        return $this;
    }

    public function setProfessor($professor)
    {
        $this->professor = $professor;

        return $this;
    }

    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    public function setCategory($category)
    {
        $this->category = $category;

        return $this;
    }

    public function setPrice($price)
    {
        $this->price = $price;

        return $this;
    }

    public function setCreatedAt($created_at)
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function setStatus($status)
    {
        $this->status = $status;

        return $this;
    }

    // Getters
    public function getId()
    {
        return $this->id;
    }

    public function getTitle()
    {
        return $this->title;
    }

    public function getProfessor()
    {
        return $this->professor;
    }

    public function getType()
    {
        return $this->type;
    }

    public function getCategory()
    {
        return $this->category;
    }

    public function getPrice()
    {
        return $this->price;
    }

    public function getCreatedAt()
    {
        return $this->created_at;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public static function fromModel(CourseApplication $courseApplication)
    {
        $courseData = new CourseApplicationData();

        $courseData->setId($courseApplication->id);
        $courseData->setTitle($courseApplication->title);
        $courseData->setProfessor($courseApplication->professor->fullname);
        $courseData->setType($courseApplication->courseType->name);
        $courseData->setCategory($courseApplication->courseCategory->name);

        $courseData->setPrice($courseApplication->price == 0 ? 'Free' : number_format($courseApplication->price, 2));

        $courseData->setCreatedAt(Carbon::parse($courseApplication->created_at)->format('Y-m-d'));

        $courseStatus = CourseApplication::PENDING;

        // Check if status is approved
        if ($courseApplication->approved_at != NULL) {
            $courseStatus = CourseApplication::APPROVED;
        }

        // Check if status is denied
        if ($courseApplication->denied_at != NULL) {
            $courseStatus = CourseApplication::DENIED;
        }

        $courseData->setStatus(ucwords($courseStatus));

        return $courseData->convertToArray();
    }

    private function convertToArray()
    {
        $objectArray = [];

        foreach ($this as $key => $value) {
            $objectArray[$key] = $value;
        }

        return $objectArray;
    }
}
