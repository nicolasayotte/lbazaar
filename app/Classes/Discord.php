<?php

namespace App\Classes;

use App\Models\CourseApplication;
use App\Models\TeacherApplication;
use App\Models\Vote;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;

class Discord
{
    private $webhook_class_url;
    private $webhook_teacher_url;

    public function __construct()
    {
        $this->webhook_teacher_url = env('DISCORD_WEBOOK_TEACHER_URL');
        $this->webhook_class_url = env('DISCORD_WEBOOK_CLASS_URL');
    }

    public function sendMessage($data, $type)
    {
	$webhook_url = '';
        if ($type === CourseApplication::class) {
            $webhook_url = $this->webhook_class_url;
        } else if ($type ===  TeacherApplication::class) {
            $webhook_url = $this->webhook_teacher_url;
        } else {
            Log::error('Discord message type not defined');
            return false;
	}

        $buildMethods = [
            CourseApplication::class => 'buildClassApplicationMessage',
            TeacherApplication::class => 'buildTeacherApplicationMessage',
            'exchange' => 'buildExchangePointsMessage'
        ];

        $messageContent = $this->{$buildMethods[$type]}($data);

        try {
            $ch = curl_init();

            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);

            curl_setopt($ch, CURLOPT_URL, $webhook_url . '?wait=true');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'embeds' => [$messageContent]
            ]));

            // Receive server response
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);

            curl_close($ch);

            return @$response ?? false;
        } catch (Exception $e) {
            Log::error($e->getMessage());

            return false;
        }
    }

    private function addEmptyLines(&$message, $count = 1)
    {
        for ($i = 0; $i < $count; $i++) {
            $message['fields'][] = [
                'name' => '',
                'value' => ''
            ];
        }
    }

    private function getVoteDescription($voteId)
    {
        $message = '';

        $message .= '** Vote ID: ** ' . $voteId . PHP_EOL . PHP_EOL;
        $message .= 'React ' . (Vote::OPTIONS[0]) . ' if you approve' . PHP_EOL . PHP_EOL;
        $message .= 'React ' . (Vote::OPTIONS[1]) . ' if you disapprove' . PHP_EOL . PHP_EOL;
        $message .= '*Note: Only the emojis above will be counted for the vote results*';

        return $message;
    }

    private function buildExchangePointsMessage($data)
    {
        $user = $data['user'];

        $message = [];

        $message['title'] = 'New Points Exchange Request';
        $message['description'] = '** ' . $data['user']->fullname . '** wants to exchange **' . $data['points'] . '** points to NFT';
        $message['fields'] = [
            [
                'name' => 'Name',
                'value' => $user->fullname
            ],
            [
                'name' => 'Email',
                'value' => $user->email
            ],
            [
                'name' => 'Points',
                'value' => $data['points']
            ],
            [
                'name' => 'Wallet ID',
                'value' => $data['wallet_id']
            ]
        ];

        return $message;
    }

    private function buildClassApplicationMessage($data)
    {
        $contents = json_decode($data->data, true);
        $message = [];

        $message['title'] = 'New Class Application Created';
        $message['description'] = $this->getVoteDescription($data->id);
        $message['footer']['text'] = 'Voting period ends on ' . $data->end_date;

        $content_keys = array_keys($contents);

        foreach ($content_keys as $key) {

            $field = [];
            $fieldName = ucwords(str_replace('_', ' ', $key));

            $field['name'] = $fieldName;

            if ($key == 'description') {
                $field['value'] = '>>> ' . $contents[$key];
            } else {
                $field['value'] = ucwords($contents[$key]);
            }

            $message['fields'][] = $field;
        }

        return $message;
    }

    private function buildTeacherApplicationMessage($data)
    {
        $contents = json_decode($data->data, true);
        $message = [];

        $message['title'] = 'New Teacher Application Created';

        $message['description'] = $this->getVoteDescription($data->id);

        $message['type'] = 'rich';
        $message['footer']['text'] = 'Voting period ends on ' . $data->end_date;

        $keys = array_keys($contents);

        foreach ($keys as $key) {

            $field = [];
            $fieldName = ucwords(str_replace('_', ' ', $key));

            if ($key == 'education') {
                if (!empty($contents[$key])) {

                    // Additional lines
                    $this->addEmptyLines($message, 2);

                    $message['fields'][] = [
                        'name' => 'Educational Background',
                        'value' => ''
                    ];

                    foreach ($contents[$key] as $index => $education) {

                        $startDate = Carbon::parse(@$education['start_date'])->format('F Y');
                        $endDate = @$education['end_date'] ? Carbon::parse(@$education['end_date'])->format('F Y') : 'Current';

                        $field['name'] = $education['school'] . " (" . $startDate . " - " . $endDate . ") ";
                        $field['value'] = $education['degree'];

                        $message['fields'][] = $field;
                    }

                    // Additional lines
                    if (empty($contents['work'])) {
                        $this->addEmptyLines($message, 1);
                    }
                }
            } else if ($key == 'work') {
                if (!empty($contents[$key])) {

                    // Additional lines
                    $this->addEmptyLines($message, 2);

                    $message['fields'][] = [
                        'name' => 'Professional History',
                        'value' => ''
                    ];

                    foreach ($contents[$key] as $work) {

                        $startDate = Carbon::parse(@$work['start_date'])->format('F Y');
                        $endDate = @$work['end_date'] ? Carbon::parse(@$work['end_date'])->format('F Y') : 'Current';

                        $field['name'] = $work['position'] . ' for ' . $work['company'] . " (" . $startDate . " - " . $endDate . ") ";
                        $field['value'] = '>>> ' . ($work['description'] ?? 'No description provided');

                        $message['fields'][] = $field;
                    }

                    // Additional lines
                    $this->addEmptyLines($message, 1);
                }
            } else if ($key == 'certification') {
                if (!empty($contents[$key])) {
                    // Additional lines
                    $this->addEmptyLines($message, 2);

                    $message['fields'][] = [
                        'name' => 'Certification',
                        'value' => ''
                    ];

                    foreach ($contents[$key] as $certification) {

                        $awardedAt = Carbon::parse(@$certification['awarded_at'])->format('F Y');

                        $field['name'] = $certification['awarded_by'] . " (" . $awardedAt . ") ";
                        $field['value'] = $certification['title'];

                        $message['fields'][] = $field;
                    }

                    // Additional lines
                    $this->addEmptyLines($message, 1);
                }
            } else {
                $field['name'] = $fieldName;

                if ($key == 'about') {
                    $field['value'] = '>>> ' . $contents[$key];
                } else {
                    $field['value'] = $contents[$key];
                }

                $message['fields'][] = $field;
            }

        }

        return $message;
    }
}
