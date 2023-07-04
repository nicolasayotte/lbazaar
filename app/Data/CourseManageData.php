<?php

namespace App\Data;

use App\Models\Course;
use Carbon\Carbon;

class CourseManageData
{
    private $id;

    private $title;

    private $description;

    private $status;

    private $type;

    private $category;

    private $nftId;

    private $createdDate;

    private $publishedDate;

    private $format;

    private $isDeletable;

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

    public function setDescription($description)
    {
        $this->description = $description;
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

    public function setNftId($nftId)
    {
        $this->nftId = $nftId;
        return $this;
    }

    public function setStatus($status)
    {
        $this->status = $status;
        return $this;
    }

    public function setCreatedDate($createdDate)
    {
        $this->createdDate = $createdDate;
        return $this;
    }

    public function setPublishedDate($publishedDate)
    {
        $this->publishedDate = $publishedDate;
        return $this;
    }

    public function setFormat($format)
    {
        $this->format = $format;
        return $this;
    }

    public function setIsDeletable($isDeletable)
    {
        $this->isDeletable = $isDeletable;
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

    public function getDescription()
    {
        return $this->description;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getType()
    {
        return $this->type;
    }

    public function getCategory()
    {
        return $this->category;
    }

    public function getNftId()
    {
        return $this->nftId;
    }

    public function getCreatedDate()
    {
        return $this->createdDate;
    }

    public function getPublishedDate()
    {
        return $this->publishedDate;
    }

    public function getFormat()
    {
        return $this->format;
    }

    public function getIsDeletable()
    {
        return $this->isDeletable;
    }

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public static function fromModel(Course $course)
    {
        $courseManageData = new CourseManageData();
        $courseManageData->setId($course->id);
        $courseManageData->setTitle($course->title);
        $courseManageData->setDescription($course->description);
        $courseManageData->setType($course->courseType->name);
        $courseManageData->setPublishedDate(Carbon::parse($course->created_at)->format('M j, Y'));
        $courseManageData->setCategory($course->courseCategory->name);
        
        if($course->nft) {
            $courseManageData->setNftId($course->nft->id);
        }
        $courseManageData->setFormat(ucwords($course->is_live ? Course::LIVE : Course::ON_DEMAND, '-'));
        $courseManageData->setIsDeletable($course->active_schedules->count() <= 0);

        return $courseManageData->getProperties();
    }
}
