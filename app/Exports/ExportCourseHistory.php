<?php

namespace App\Exports;

use App\Repositories\CourseHistoryRepository;
use Illuminate\Support\Collection;
use App\Exports\ExportWalletHistorySheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Http\Request;

class ExportCourseHistory implements WithMultipleSheets
{

    private $users;
    private $courseHistoryRepository;

    public function __construct($users)
    {
        $this->users = $users;
        $this->courseHistoryRepository = new CourseHistoryRepository();
    }

    public function sheets(): array
    {
        $sheets = [];
        $courseHistoryData = new Collection();
        foreach($this->users as $user) {
            // $courseHistoryData = new Collection();
            $courseHistories = $this->courseHistoryRepository->search(new Request(), $user->id);

            foreach ($courseHistories as $courseHistory) {
                $courseHistoryData->add([
                    'Email' => $user->email,
                    'Classes'=> $courseHistory['title'],
                    'Type'=>$courseHistory['type'],
                    'Category'=>$courseHistory['category'],
                    'Teacher'=>$courseHistory['teacher'],
                    'Booked Date'=> $courseHistory['booked_date'],
                    'Status'=> $courseHistory['status'],
                    'is Package'=> $courseHistory['isPackage'],
                ]);
            }
            if (count($courseHistories) > 0 ) {
                // $sheets[] = new ExportCourseHistorySheet($courseHistoryData, $user->email);
            }
        }
        $sheets[] = new ExportCourseHistorySheet($courseHistoryData, 'Class History');
        if (!(count($sheets)  > 0)) {
            $sheets[] = new ExportCourseHistorySheet(new Collection(), 'no data');
        }

        return $sheets;
    }
}
