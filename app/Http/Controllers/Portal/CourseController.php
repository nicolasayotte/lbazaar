<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchClassRequest;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\WalletTransactionHistory;
use App\Models\CourseType;
use App\Models\Role;
use App\Models\User;
use App\Repositories\CourseApplicationRepository;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseScheduleRepository;
use App\Repositories\CourseHistoryRepository;
use App\Repositories\WalletTransactionHistoryRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\TranslationRepository;
use App\Repositories\UserRepository;
use Inertia\Inertia;
use Carbon\Carbon;
class CourseController extends Controller
{
    public $courseTypeRepository;

    public $courseCategoryRepository;

    public $courseRepository;

    public $courseScheduleRepository;

    public $userRepository;

    public $courseApplicationRepository;

    public $courseHistoryRepository;

    public $walletTransactionHistoryRepository;

    public function __construct()
    {
        $this->courseTypeRepository = new CourseTypeRepository();
        $this->courseCategoryRepository = new CourseCategoryRepository();
        $this->courseRepository = new CourseRepository();
        $this->courseScheduleRepository = new CourseScheduleRepository();
        $this->userRepository = new UserRepository();
        $this->courseApplicationRepository = new CourseApplicationRepository();
        $this->courseHistoryRepository = new CourseHistoryRepository();
        $this->walletTransactionHistoryRepository = new WalletTransactionHistoryRepository();
    }

    public function index(SearchClassRequest $request)
    {
        $languages = $this->courseRepository->getLanguages();
        $types = $this->courseTypeRepository->getAll();
        $categories = $this->courseCategoryRepository->getAll();
        $teachers = $this->userRepository->getAllTeachers();

        $courses = $this->courseRepository->search($request);

        return Inertia::render('Portal/Course/Search', [
                'course_types'          => $types,
                'course_categories'     => $categories,
                'languages'             => $languages,
                'teachers'              => $teachers,
                'courses'               => $courses,
                'page'                  => @$request['page'] ?? 1,
                'month'                 => @$request['month'] ?? '',
                'search_text'           => @$request['search_text'] ?? '',
                'category_id'           => @$request['category_id'] ?? '',
                'type_id'               => @$request['type_id'] ?? '',
                'status'                => @$request['status'] ?? '',
                'language'              => @$request['language'] ?? '',
                'professor_id'          => @$request['professor_id'] ?? '',
                'title'                 => 'Browse Courses'
            ])->withViewData([
                'title'       => 'Browse Courses',
                'description' => 'Course Lists'
            ]);
    }

    public function details($id)
    {
        $course = $this->courseRepository->findById($id);
        $schedules = $this->courseScheduleRepository->findByCourseId($course->id);

        return Inertia::render('Portal/Course/Details', [
            'course'            => $course,
            'schedules'         => $schedules,
            'isBooked'          => auth()->user() && auth()->user()->isCourseBooked($id),
            'hasFeedback'       => auth()->user() && auth()->user()->hasFeedback($id),
            'title'             => 'Course - ' . $course->title,
        ])->withViewData([
            'title'       => 'Course - ' . $course->title,
            'description' => 'Course Details'
        ]);
    }

    public function book($schedule_id)
    {
        //TODO ongoing cannot booked
        $schedule = CourseSchedule::find($schedule_id)->load('course');
        $isBooked = count($this->courseHistoryRepository->findByUserAndCourseScheduleID(auth()->user()->id, $schedule_id)) > 0;
        $isFullyBooked = count($this->courseHistoryRepository->findByCourseScheduleID($schedule_id)) == $schedule->max_participant;
        $userWallet = auth()->user()->userWallet()->first();
        $adminWallet = $this->userRepository->getAdmin()->userWallet()->first();
        $teacherWallet = $schedule->course->professor()->first()->userWallet()->first();

        if (!$isBooked && !$isFullyBooked && ($userWallet->points >= $schedule->course->price)) {
            $courseHistory = CourseHistory::create([
                'course_schedule_id' => $schedule->id,
                'course_id'          => $schedule->course->id,
                'user_id'            => auth()->user()->id,
            ]);
            if ($schedule->course->courseType->name != CourseType::FREE) {

                $newUserPoints =  $userWallet->points - $schedule->course->price;
                $this->updateWalletHistory($userWallet, WalletTransactionHistory::BOOK, $newUserPoints, $courseHistory);
                $this->updateWallet($userWallet, $newUserPoints);

                $teacherCommission = (int)($schedule->course->price / 100 * ($schedule->course->professor()->first()->commission_rate));
                $newTeacherPoints = $teacherWallet->points + $teacherCommission;
                $this->updateWalletHistory($teacherWallet, WalletTransactionHistory::COMMISSION, $newTeacherPoints, $courseHistory);
                $this->updateWallet($teacherWallet, $newTeacherPoints);

                $adminCommission = $schedule->course->price - $teacherCommission;
                $newAdminPoints =  $adminWallet->points + $adminCommission;
                $this->updateWalletHistory($adminWallet, WalletTransactionHistory::COMMISSION, $newAdminPoints, $courseHistory);
                $this->updateWallet($adminWallet, $newAdminPoints);

            }

        } else {
            return redirect()->back()->withErrors([
                'error' => trans('messages.error')
            ]);
        }

        return redirect()->back();
    }

    public function cancel($schedule_id)
    {
        $courseHistory = $this->courseHistoryRepository->findByUserAndCourseScheduleID(auth()->user()->id, $schedule_id)->first();
        $schedule = CourseSchedule::find($schedule_id)->load('course');
        $course = $schedule->course;
        $isCancellable = $course->is_cancellable;
        $date = Carbon::parse($schedule->start_datetime);
        $now = Carbon::now();
        $dateDiff = $date->diffInDays($now);
        $userWallet = auth()->user()->userWallet()->first();
        $adminWallet = $this->userRepository->getAdmin()->userWallet()->first();
        $teacherWallet = $schedule->course->professor()->first()->userWallet()->first();

        if(isset($courseHistory->id) && $isCancellable && $dateDiff >= $course->days_before_cancellation) {
            if ($schedule->course->courseType->name != CourseType::FREE) {

                $userWalletTransaction = $this->walletTransactionHistoryRepository->findByUserWalletAndCourseHistoryID($userWallet->id, $courseHistory->id);
                $newUserPoints = $userWallet->points + abs($userWalletTransaction->points_before - $userWalletTransaction->points_after);
                $this->updateWalletHistory($userWallet, WalletTransactionHistory::REFUND, $newUserPoints, $courseHistory);
                $this->updateWallet($userWallet, $newUserPoints);

                $adminWalletTransaction = $this->walletTransactionHistoryRepository->findByUserWalletAndCourseHistoryID($adminWallet->id, $courseHistory->id);
                $newAdminPoints = $adminWallet->points - abs($adminWalletTransaction->points_before - $adminWalletTransaction->points_after);
                $this->updateWalletHistory($adminWallet, WalletTransactionHistory::REFUND, $newAdminPoints, $courseHistory);
                $this->updateWallet($adminWallet, $newAdminPoints);

                $teacherWalletTransaction = $this->walletTransactionHistoryRepository->findByUserWalletAndCourseHistoryID($teacherWallet->id, $courseHistory->id);
                $newTeacherPoints = $teacherWallet->points - abs($teacherWalletTransaction->points_before - $teacherWalletTransaction->points_after);
                $this->updateWalletHistory($teacherWallet, WalletTransactionHistory::REFUND, $newTeacherPoints, $courseHistory);
                $this->updateWallet($teacherWallet, $newTeacherPoints);
            }

            $courseHistory->update([
                'is_cancelled' => true,
            ]);

        } else {
            return redirect()->back()->withErrors([
                'error' => trans('messages.error')
            ]);
        }

        return redirect()->back();
    }

    public function create($id)
    {
        $courseApplication = $this->courseApplicationRepository->findOneApproved($id);

        return Inertia::render('Portal/Course/Create', [
            'courseApplication' => $courseApplication,
            'categories'        => $this->courseCategoryRepository->getDropdownData(),
            'title'             => TranslationRepository::getTranslation('title.class.create')
        ])->withViewData([
            'title'             => TranslationRepository::getTranslation('title.class.create')
        ]);
    }

    public function updateWalletHistory($userWallet, $transactionType, $newUserPoints, $courseHistory) {
        WalletTransactionHistory::create([
            'user_wallet_id' => $userWallet->id,
            'course_history_id' => isset($courseHistory->id) ? $courseHistory->id : null,
            'type' => $transactionType,
            'points_before' => $userWallet->points,
            'points_after' => $newUserPoints,
        ]);
    }


    public function updateWallet($userWallet, $newUserPoints) {
        $userWallet->update([
            'points' => $newUserPoints
        ]);
    }
}
