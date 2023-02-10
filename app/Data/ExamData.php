<?php

namespace App\Data;

use App\Models\Exam;
use App\Models\Status;

class ExamData
{
    private $id;

	private $course_id;

	private $name;

	private $total_items;

	private $total_points;

	private $status;

    // Setters
    public function setId($id)
	{
		$this->id = $id;
		return $this;
	}

	public function setCourseId($course_id)
	{
		$this->course_id = $course_id;
		return $this;
	}

	public function setName($name)
	{
		$this->name = $name;
		return $this;
	}

	public function setTotalItems($total_items)
	{
		$this->total_items = $total_items;
		return $this;
	}

	public function setTotalPoints($total_points)
	{
		$this->total_points = $total_points;
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

	public function getCourseId()
	{
		return $this->course_id;
	}

	public function getName()
	{
		return $this->name;
	}

	public function getTotalItems()
	{
		return $this->total_items;
	}

	public function getTotalPoints()
	{
		return $this->total_points;
	}

	public function getStatus()
	{
		return $this->status;
	}

    public function getProperties()
    {
        return get_object_vars($this);
    }

    public static function fromModel(Exam $exam)
    {
        $examData = new ExamData();

        $examData->setId(@$exam->id);
        $examData->setCourseId(@$exam->course_id);
        $examData->setName(@$exam->name);
        $examData->setTotalItems(@$exam->items()->count());
        $examData->setTotalPoints(@$exam->items()->sum('points'));
        $examData->setStatus(@$exam->published_at ? Status::ACTIVE : Status::DISABLED);

        return $examData->getProperties();
    }
}
