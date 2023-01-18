<?php

namespace App\Data;

use App\Models\Course;

class CourseManageData
{
    private $id;

	private $title;

	private $description;

	private $status;

	private $createdDate;

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

	public function getCreatedDate()
	{
		return $this->createdDate;
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
        $courseManageData->setStatus(ucwords($course->status->name));

        return $courseManageData->getProperties();
    }
}
