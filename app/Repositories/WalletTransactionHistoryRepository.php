<?php

namespace App\Repositories;

use App\Data\CourseHistoryData;
use App\Data\CourseManageStudentData;
use App\Models\WalletTransactionHistory;
use Illuminate\Support\Facades\Auth;

class WalletTransactionHistoryRepository extends BaseRepository
{

    const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new WalletTransactionHistory());
    }

    public function findByUserWalletAndCourseHistoryID($user_wallet_id, $course_history_id)
    {
        $walletHistory = $this->model->where('user_wallet_id', $user_wallet_id)->where('course_history_id', $course_history_id)->first();
        return $walletHistory != null ?  $walletHistory : [];
    }
}
