<?php

namespace App\Repositories;

use App\Data\ExamData;
use App\Models\Exam;
use App\Models\Setting;
use App\Models\Status;
use App\Models\User;
use App\Models\UserExam;
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
        $exam = $this->model->create($data);

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

    public function canUserTakeExam($userID, $scheduleID, $examID)
    {
        $user = User::findOrFail($userID);
        $exam = $this->findOrFail($examID);

        $schedule = @$user->schedules()->where('course_schedules.id', $scheduleID)->first();

        $isExamTaken = @$user->exams()
                                ->where('course_schedule_id', $scheduleID)
                                ->where('exam_id', $examID)
                                ->first() != null;

        $canTakeExam = false;

        if (
            @$exam->published_at != null &&
            @$schedule &&
            @$schedule->status == ucwords(Status::ONGOING) &&
            !$isExamTaken
        ) {
            $canTakeExam = true;
        }

        return $canTakeExam;
    }

    public function submitAnswers(Exam $exam, $schedule_id, $answers)
    {
        $user = auth()->user();

        $userExam = UserExam::create([
            'exam_id'            => $exam->id,
            'user_id'            => $user->id,
            'total_score'        => 0,
            'course_schedule_id' => $schedule_id,
        ]);

        $totalPoints = 0;

        foreach ($answers as $answer) {
            $answer['is_correct'] = false;

            $examItem = $exam->items()->where('id', $answer['exam_item_id'])->first();

            if (@$examItem != null && @$examItem->correct_choice_id == $answer['exam_item_choice_id']) {
                $answer['is_correct'] = true;
                $totalPoints += $examItem->points;
            }

            $userExam->answers()->create($answer);
        }
        $examPassingPercentage = Setting::where('slug', 'exam-passing-percentage')->first();
        $isPass = ($totalPoints / count($answers) * 100) >= $examPassingPercentage->value;
        $userExam->update([
            'total_score' => $totalPoints,
            'is_passed' => $isPass
        ]);

        return $userExam;
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
