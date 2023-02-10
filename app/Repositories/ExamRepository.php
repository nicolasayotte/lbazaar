<?php

namespace App\Repositories;

use App\Data\ExamData;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\ExamItemChoice;
use App\Models\Status;
use Carbon\Carbon;

class ExamRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Exam());
    }

    public function searchCourseExams($courseID, $filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model
                    ->with(['items'])
                    ->where('course_id', $courseID)
                    ->where('name', 'LIKE', '%'.@$filters['keyword'].'%')
                    ->when(@$filters['status'] && @$filters['status'] != '', function($q) use($filters) {
                        if (@$filters['status'] == Status::ACTIVE) {
                            return $q->where('published_at', '!=', NULL);
                        }

                        return $q->where('published_at', NULL);
                    })
                    ->orderBy($sortBy, $sortOrder)
                    ->paginate(Exam::PER_PAGE)
                    ->through(function($exam) {
                        return ExamData::fromModel($exam);
                    });
    }

    public function create($data)
    {
        $exam = $this->create($data);

        $this->createItems($exam, $data['items']);
    }

    public function update($id, $data)
    {
        $exam = $this->findOrFail($id);

        $exam->items()->delete();

        $this->createItems($exam, $data['items']);
    }

    public function toggleStatus($id, $status)
    {
        $exam = $this->findOrFail($id);

        $exam->published_at = $status === Status::ACTIVE ? Carbon::now() : null;
        $exam->save();
    }

    private function createItems($exam, $items)
    {
        foreach ($items as $index => $item) {
            $item['sort'] = $index + 1;

            $examItem = $exam->items()->create($item);

            foreach ($item['choices'] as $choiceIndex => $choice) {
                $choice['sort'] = $choiceIndex + 1;

                $examItemChoice = $examItem->choices()->create($choice);

                if ($item['correct_index'] == $choiceIndex) {
                    $examItem->correct_choice_id = $examItemChoice->id;
                    $examItem->save();
                }
            }
        }
    }
}
