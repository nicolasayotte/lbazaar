<?php

namespace App\Data;

use App\Models\Course;
use Carbon\Carbon;

class CourseData
{
    private $id;

    private $typeId;

    private $categoryId;

    private $nftId;

    private $title;

    private $description;

    private $status;

    private $type;

    private $category;

    private $language;

    private $price;

    private $pointsEarned;

    private $imageThumbnail;

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

    public function setStatus($status)
    {
        $this->status = $status;
        return $this;
    }

    public function setLanguage($language): self
    {
        $this->language = $language;

        return $this;
    }

    public function setCategoryId($categoryId): self
    {
        $this->categoryId = $categoryId;

        return $this;
    }

    public function setNftId($nftId)
    {
        $this->nftId = $nftId;
        
        return $this;
    }

    public function setTypeId($typeId): self
    {
        $this->typeId = $typeId;

        return $this;
    }

    public function setPrice($price): self
    {
        $this->price = $price;

        return $this;
    }

    public function setPointsEarned($pointsEarned): self
    {
        $this->pointsEarned = $pointsEarned;

        return $this;
    }

    public function setImageThumbnail($imageThumbnail): self
    {
        $this->imageThumbnail = $imageThumbnail;

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

    public function getLanguage()
    {
        return $this->language;
    }

    public function getCategoryId()
    {
        return $this->categoryId;
    }

    public function getNftId()
    {
        return $this->nft_id;
    }

    public function getTypeId()
    {
        return $this->typeId;
    }

    public function getPrice()
    {
        return $this->price;
    }

    public function getPointsEerned()
    {
        return $this->pointsEarned;
    }

    public function getImageThumbnail()
    {
        return $this->imageThumbnail;
    }

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public static function fromModel(Course $course)
    {
        $courseManageData = new CourseData();
        $courseManageData->setId($course->id);
        $courseManageData->setCategoryId($course->courseCategory->id);
        $courseManageData->setTypeId($course->courseType->id);
        $courseManageData->setTitle($course->title);
        $courseManageData->setDescription($course->description);
        $courseManageData->setType($course->courseType->name);
        $courseManageData->setCategory($course->courseCategory->name);
        
        if($course->nft) {
            $courseManageData->setNftId($course->nft->id);
        }$courseManageData->setLanguage($course->language);
        $courseManageData->setPrice($course->price == null ? 0 : $course->price);
        $courseManageData->setPointsEarned($course->points_earned == null ? 0 : $course->points_earned);
        $courseManageData->setStatus(ucwords($course->status->name));

        return $courseManageData->getProperties();
    }

}
