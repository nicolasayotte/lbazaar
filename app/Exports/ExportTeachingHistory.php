<?php

namespace App\Exports;

use App\Repositories\CourseHistoryRepository;
use App\Repositories\CourseScheduleRepository;
use Illuminate\Support\Collection;
use App\Exports\ExportWalletHistorySheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Http\Request;

class ExportTeachingHistory implements WithMultipleSheets
{
    private $users;
    private $courseHistoryRepository;
    private $courseScheduleRepository;

    public function __construct($users)
    {
        $this->users = $users;
        $this->courseHistoryRepository = new CourseHistoryRepository();
        $this->courseScheduleRepository = new CourseScheduleRepository();
    }

    public function sheets(): array
    {
        $sheets = [];

        foreach($this->users as $user) {
            $teachingHistoryData = new Collection();
            $teachingHistories = $this->courseScheduleRepository->get(null, new Request, $user->id);;

            foreach ($teachingHistories as $teachingHistory) {
                $teachingHistoryData->add([
                    'Date'=> $teachingHistory['formatted_start_datetime'],
                    'Class Name'=>$teachingHistory['course']['title'],
                    'Users Booked'=>$teachingHistory['total_bookings'],
                    'Status'=>$teachingHistory['status']
                ]);
            }
            if (count($teachingHistories) > 0 ) {
                $sheets[] = new ExportTeachingHistorySheet($teachingHistoryData, $user->email);
            }
        }

        if (!(count($sheets)  > 0)) {
            $sheets[] = new ExportTeachingHistorySheet(new Collection(), 'no data');
        }

        return $sheets;
    }
}
