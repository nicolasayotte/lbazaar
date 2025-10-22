<?php

namespace App\Data;

use App\Models\Course;
use Carbon\Carbon;

class CourseData
{
    private $id;

    private $typeId;

    private $categoryIds = [];

    private $nftId;

    private $title;

    private $description;

    private $status;

    private $type;

    private $categories = [];

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

    public function setCategories($categories)
    {
        $this->categories = $categories;
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

    public function setCategoryIds($categoryIds): self
    {
        $this->categoryIds = $categoryIds;
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

    public function getCategories()
    {
        return $this->categories;
    }

    public function getLanguage()
    {
        return $this->language;
    }

    public function getCategoryIds()
    {
        return $this->categoryIds;
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
        // Set categories as array of names and ids
        $categoryNames = $course->categories->pluck('name')->toArray();
        $categoryIds = $course->categories->pluck('id')->toArray();
        $courseManageData->setCategories($categoryNames);
        $courseManageData->setCategoryIds($categoryIds);
        $courseManageData->setTypeId($course->courseType->id);
        $courseManageData->setTitle($course->title);
        $courseManageData->setDescription($course->description);
        $courseManageData->setType($course->courseType->name);
        if($course->nft) {
            $courseManageData->setNftId($course->nft->id);
        }
        $courseManageData->setLanguage($course->language);
        $courseManageData->setPrice($course->price == null ? 0 : $course->price);
        $courseManageData->setPointsEarned($course->points_earned == null ? 0 : $course->points_earned);
        $courseManageData->setStatus(ucwords($course->status->name));
        return $courseManageData->getProperties();
    }

}
