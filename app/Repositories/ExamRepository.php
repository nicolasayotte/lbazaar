<?php

namespace App\Repositories;

use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\ExamItemChoice;

class ExamRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Exam());
    }

    public function create($data)
    {
        $exam = Exam::create($data);

        $items = $data['items'];

        foreach ($items as $index => $item) {
            $item['sort'] = $index + 1;

            $examItem = $exam->items()->create($item);

            foreach ($item['choices'] as $choiceIndex => $choice) {
                $choice['sort'] = $choiceIndex + 1;

                $examItemChoice = ExamItemChoice::create($choice);

                if ($item['correct_index'] == $choiceIndex) {
                    $examItem->correct_choice_id = $examItemChoice->id;
                    $examItem->save();
                }
            }
        }
    }
}
