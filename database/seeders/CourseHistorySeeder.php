<?php

namespace Database\Seeders;

use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\CourseType;
use App\Models\WalletTransactionHistory;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $students = User::whereRoleIs(Role::STUDENT)->get();
        $coursesSchedules  = CourseSchedule::all();

        foreach ($coursesSchedules as $coursesSchedule) {
            $course = $coursesSchedule->course()->first();
            foreach ($students as $student) {
                $isBooked = count(CourseHistory::where('user_id', $student->id)
                    ->where('course_schedule_id', $coursesSchedule->id)
                    ->where('is_cancelled', null)
                    ->get()) > 0;
                $isFullyBooked = count(CourseHistory::where('course_schedule_id', $coursesSchedule->id)->where('is_cancelled', false)->get()) == $coursesSchedule->max_participant;
                $userWallet = $student->userWallet()->first();
                $adminWallet = User::whereRoleIs([Role::ADMIN])->first()->userWallet()->first();
                $teacherWallet = $course->professor()->first()->userWallet()->first();

                if (!$isBooked && !$isFullyBooked && ($userWallet->points >= $course->price)) {
                    $courseHistory = CourseHistory::updateOrCreate([
                        'course_schedule_id' => $coursesSchedule->id,
                        'course_id'          => $course->id,
                        'user_id'            => $student->id,
                        'completed_at'       => null
                    ]);
                    if ($course->courseType->name != CourseType::FREE) {



                        $newUserPoints =  $userWallet->points - $course->price;
                        $this->updateWalletHistory($userWallet, WalletTransactionHistory::BOOK, $newUserPoints, $courseHistory);
                        $this->updateWallet($userWallet, $newUserPoints);

                        $teacherCommission = (int)($course->price / 100 * ($course->professor()->first()->commission_rate));
                        $newTeacherPoints = $teacherWallet->points + $teacherCommission;
                        $this->updateWalletHistory($teacherWallet, WalletTransactionHistory::COMMISSION, $newTeacherPoints, $courseHistory);
                        $this->updateWallet($teacherWallet, $newTeacherPoints);

                        $adminCommission = $course->price - $teacherCommission;
                        $newAdminPoints =  $adminWallet->points + $adminCommission;
                        $this->updateWalletHistory($adminWallet, WalletTransactionHistory::COMMISSION, $newAdminPoints, $courseHistory);
                        $this->updateWallet($adminWallet, $newAdminPoints);

                    }

                }
            }
        }
    }

    public function updateWalletHistory($userWallet, $transactionType, $newUserPoints, $courseHistory) {
        WalletTransactionHistory::updateOrCreate([
            'user_wallet_id' => $userWallet->id,
            'course_history_id' => isset($courseHistory->id) ? $courseHistory->id : null,
            'type' => $transactionType,
            'points_before' => $userWallet->points,
            'points_after' => $newUserPoints,
            'tx_id' => '687b187b5dc6b6525f859989556cf320bfb9c101276c192af2db7d012e35834b',
            'status' => 'confirmed'
        ]);
    }


    public function updateWallet($userWallet, $newUserPoints) {
        $userWallet->update([
            'points' => $newUserPoints
        ]);
    }
}
