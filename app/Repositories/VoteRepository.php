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
            'data' => $applicationData->data,
            'counted_option' => Vote::DEFAULT_EMOJI
        ];

        $vote = $this->model->create($voteData);

        $vote->voteable()->associate($applicationData)->save();

        if (!Discord::sendMessage($vote, $applicationData::class)) {
            session()->flash('error', getTranslation('error'));
        }

        return $vote;
    }

    public function processVotes($resultData)
    {
        $vote = $this->model->with('voteable')->findOrFail($resultData['vote_id']);

        // Check if vote results have been posted already then return false
        if (!@$vote || $vote->result_data != null || $vote->approved_at != null || $vote->denied_at != null) {
            return false;
        }

        $vote->result_data = json_encode($resultData);

        if ($this->tallyVotes($vote, $resultData['tally'])) {
            $vote->denied_at = null;
            $vote->approved_at = Carbon::now();
        } else {
            $vote->approved_at = null;
            $vote->denied_at = Carbon::now();
        }

        $vote->save();

        return $vote;
    }

    /**
     * Count the number of votes
     * Returns true if passed, otherwise false
     *
     * @return bool
     */
    private function tallyVotes($vote, $tally)
    {
        $options = array_keys($tally);

        $approveVotes = $tally[$vote->counted_option] ?? 0;

        $totalNumberOfVotes = 0;

        foreach ($options as $option) {
            $totalNumberOfVotes += $tally[$option];
        }

        if ($approveVotes > 0 && (($approveVotes / $totalNumberOfVotes) * 100) >= Vote::PASSING_PERCENTAGE) {
            return true;
        }

        return false;
    }
}
