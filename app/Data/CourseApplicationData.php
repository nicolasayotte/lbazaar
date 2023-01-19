<?php

namespace App\Data;

use App\Models\CourseApplication;
use Carbon\Carbon;

class CourseApplicationData
{
    private $id;

	private $title;

	private $professor_name;

	private $professor_email;

	private $professor_classification;

	private $professor_created_at;

	private $type;

	private $price;

	private $category;

	private $created_at;

	private $status;

	private $description;

	private $points_earned;

	private $approved_at;

	private $denied_at;

	private $language;

	private $isCourseCreated;

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

	public function setProfessorName($professor_name)
	{
		$this->professor_name = $professor_name;
		return $this;
	}

	public function setProfessorEmail($professor_email)
	{
		$this->professor_email = $professor_email;
		return $this;
	}

	public function setProfessorClassification($professor_classification)
	{
		$this->professor_classification = $professor_classification;
		return $this;
	}

	public function setProfessorCreatedAt($professor_created_at)
	{
		$this->professor_created_at = $professor_created_at;
		return $this;
	}

	public function setType($type)
	{
		$this->type = $type;
		return $this;
	}

	public function setPrice($price)
	{
		$this->price = $price;
		return $this;
	}

	public function setCategory($category)
	{
		$this->category = $category;
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

	public function setDescription($description)
	{
		$this->description = $description;
		return $this;
	}

	public function setPointsEarned($points_earned)
	{
		$this->points_earned = $points_earned;
		return $this;
	}

	public function setApprovedAt($approved_at)
	{
		$this->approved_at = $approved_at;
		return $this;
	}

	public function setDeniedAt($denied_at)
	{
		$this->denied_at = $denied_at;
		return $this;
	}

	public function setLanguage($language)
	{
		$this->language = $language;
		return $this;
	}

	public function setIsCourseCreated($isCourseCreated): self
	{
		$this->isCourseCreated = $isCourseCreated;

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

	public function getProfessorName()
	{
		return $this->professor_name;
	}

	public function getProfessorEmail()
	{
		return $this->professor_email;
	}

	public function getProfessorClassification()
	{
		return $this->professor_classification;
	}

	public function getProfessorCreatedAt()
	{
		return $this->professor_created_at;
	}

	public function getType()
	{
		return $this->type;
	}

	public function getPrice()
	{
		return $this->price;
	}

	public function getCategory()
	{
		return $this->category;
	}

	public function getCreatedAt()
	{
		return $this->created_at;
	}

	public function getStatus()
	{
		return $this->status;
	}

	public function getDescription()
	{
		return $this->description;
	}

	public function getPointsEarned()
	{
		return $this->points_earned;
	}

	public function getApprovedAt()
	{
		return $this->approved_at;
	}

	public function getDeniedAt()
	{
		return $this->denied_at;
	}

	public function getLanguage()
	{
		return $this->language;
	}

	public function getIsCourseCreated()
	{
		return $this->isCourseCreated;
	}

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public static function fromModel(CourseApplication $courseApplication)
    {
        $courseData = new CourseApplicationData();

        $courseData->setId($courseApplication->id);
        $courseData->setTitle($courseApplication->title);
        $courseData->setType($courseApplication->courseType->name);
        $courseData->setCategory($courseApplication->courseCategory->name);
        $courseData->setLanguage($courseApplication->language);
        $courseData->setDescription($courseApplication->description);

        $courseData->setProfessorName($courseApplication->professor->fullname);
        $courseData->setProfessorEmail($courseApplication->professor->email);
        $courseData->setProfessorClassification($courseApplication->professor->classification->name);
        $courseData->setProfessorCreatedAt(Carbon::parse($courseApplication->professor->created_at)->format('Y-m-d'));

        $courseData->setPrice($courseApplication->price == 0 ? 'Free' : number_format($courseApplication->price, 2));
        $courseData->setPointsEarned($courseApplication->points_earned == 0 ? "N/A" : number_format($courseApplication->points_earned, 2));

        $courseData->setCreatedAt(Carbon::parse($courseApplication->created_at)->format('Y-m-d'));
        $courseData->setDeniedAt(@$courseApplication->denied_at ? Carbon::parse($courseApplication->denied_at)->format('Y-m-d') : NULL);
        $courseData->setApprovedAt(@$courseApplication->approved_at ? Carbon::parse($courseApplication->approved_at)->format('Y-m-d') : NULL);

        $courseData->setIsCourseCreated(!empty($courseApplication->course) ? true : false);

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

        return $courseData->getProperties();
    }
}
