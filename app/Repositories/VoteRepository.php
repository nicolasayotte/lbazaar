<?php

namespace App\Repositories;

use App\Models\Vote;
use Carbon\Carbon;

class VoteRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Vote());
    }

    public function generateNewId($data)
    {
        $voteData = [
            'end_date' => Carbon::now()->addDays(7)->format('Y-m-d'),
            'data' => $data
        ];

        return $this->model->create($voteData);
    }
}
