<?php

namespace App\Data;

use App\Models\Course;
use App\Models\CourseContent;
use Carbon\Carbon;

class CourseContentData
{
    private $id;

    private $title;

    private $description;

    private $videoPath;

    private $zoomLink;

    private $imageThumbnail;

    private $isLive;

    private $max_participant;

    private $scheduledDate;

    private $createdAt;

    // Setters
    public function setTitle($title): self
    {
        $this->title = $title;

        return $this;
    }

    public function setId($id): self
    {
        $this->id = $id;

        return $this;
    }

    public function setDescription($description): self
    {
        $this->description = $description;

        return $this;
    }

    public function setVideoPath($videoPath): self
    {
        $this->videoPath = $videoPath;

        return $this;
    }

    public function setZoomLink($zoomLink): self
    {
        $this->zoomLink = $zoomLink;

        return $this;
    }

    public function setImageThumbnail($imageThumbnail): self
    {
        $this->imageThumbnail = $imageThumbnail;

        return $this;
    }

    public function setIsLive($isLive): self
    {
        $this->isLive = $isLive;

        return $this;
    }

    public function setMaxParticipant($max_participant): self
    {
        $this->max_participant = $max_participant;

        return $this;
    }

    public function setScheduledDate($scheduledDate): self
    {
        $this->scheduledDate = $scheduledDate;

        return $this;
    }

    // Getters
    public function getTitle()
    {
        return $this->title;
    }

    public function getId()
    {
        return $this->id;
    }

    public function getDescription()
    {
        return $this->description;
    }

    public function getVideoPath()
    {
        return $this->videoPath;
    }

    public function getZoomLink()
    {
        return $this->zoomLink;
    }

    public function getImageThumbnail()
    {
        return $this->imageThumbnail;
    }

    public function getIsLive()
    {
        return $this->isLive;
    }

    public function getMaxParticipant()
    {
        return $this->max_participant;
    }

    public function getScheduledDate()
    {
        return $this->scheduledDate;
    }

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public static function fromModel(CourseContent $course)
    {
        $contentData = new CourseContentData();
        $contentData->setId($course->id);
        $contentData->setTitle($course->title);
        $contentData->setDescription($course->description);

        return $contentData->getProperties();
    }
}
