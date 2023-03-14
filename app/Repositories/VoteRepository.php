<?php

namespace App\Repositories;

use App\Facades\Discord;
use App\Models\Vote;
use Carbon\Carbon;

class VoteRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Vote());
    }

    public function generateNewId($applicationData)
    {
        $voteData = [
            'end_date' => Carbon::now()->addDays(7)->format('Y-m-d'),
            'data' => $applicationData->data
        ];

        $vote = $this->model->create($voteData);

        $vote->voteable()->associate($applicationData)->save();

        if (!Discord::sendMessage($vote, 'class')) {
            session()->flash('error', getTranslation('error'));
        }

        return $vote;
    }
}
