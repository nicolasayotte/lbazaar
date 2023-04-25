<?php

namespace App\Exports;

use App\Repositories\CourseHistoryRepository;
use Illuminate\Support\Collection;
use App\Exports\ExportWalletHistorySheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Http\Request;

class ExportBadges implements WithMultipleSheets
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
        $badgeData = new Collection(); //comment to make each tab per user
         foreach($this->users as $user) {
            // $badgeData = new Collection();  // uncomment to make each tab per user

            foreach ($user->badges()->get() as $badge) {
                $badgeData->add([
                    'Type'=> $badge['type'],
                    'Badge Name'=>$badge['name'],
                    'Date'=>$badge['formatted_datetime'],
                ]);
            }
            if (count($user->badges()->get()) > 0 ) {
                // $sheets[] = new ExportBadgesSheet($badgeData, $user->email);  // uncomment to make each tab per user
            }
        }
        $sheets[] = new ExportBadgesSheet($badgeData, 'Badges'); //comment to make each tab per user
        if (!(count($sheets)  > 0)) {
            $sheets[] = new ExportBadgesSheet(new Collection(), 'no data');
        }
        return $sheets;
    }
}
