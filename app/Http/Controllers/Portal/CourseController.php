<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseRequest;
use App\Http\Requests\CreateCourseRequest;
use App\Http\Requests\SearchClassRequest;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\WalletTransactionHistory;
use App\Models\CourseType;
use App\Models\Status;
use App\Repositories\CourseApplicationRepository;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseFeedbackRepository;
use App\Repositories\CourseScheduleRepository;
use App\Repositories\CourseHistoryRepository;
use App\Repositories\CoursePackageRepository;
use App\Repositories\WalletTransactionHistoryRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\TranslationRepository;
use App\Repositories\UserRepository;
use Inertia\Inertia;
use Carbon\Carbon;
use DateTime;
use DateTimeZone;
use Illuminate\Http\Request;

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

    public $coursePackageRepository;

    public $courseFeedbackRepository;

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
        $this->coursePackageRepository = new CoursePackageRepository();
        $this->courseFeedbackRepository = new CourseFeedbackRepository();
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

    public function details($id, Request $request)
    {
        $feedbackCount = @$request['feedback_count'] ?? CourseFeedbackRepository::PER_PAGE;

        $course = $this->courseRepository->findById($id);
        $schedules = $this->courseScheduleRepository->findByCourseId($course->id);
        $feedbacks = $this->courseFeedbackRepository->loadByCourseId($id, $feedbackCount);

        return Inertia::render('Portal/Course/Details', [
            'course'           => $course,
            'schedules'        => $schedules,
            'feedbacks'        => $feedbacks,
            'isBooked'         => auth()->user() && auth()->user()->isCourseBooked($id),
            'hasFeedback'      => auth()->user() && auth()->user()->hasFeedback($id),
            'title'            => $course->title,
            'feedbackCount'    => $feedbackCount,
            'feedbacksPerPage' => CourseFeedbackRepository::PER_PAGE
        ])->withViewData([
            'title'            => $course->title,
            'description'      => 'Course Details'
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
            if ($schedule->course->courseType->type != CourseType::FREE) {

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
        $userWallet = auth()->user()->userWallet()->first();
        $adminWallet = $this->userRepository->getAdmin()->userWallet()->first();
        $teacherWallet = $schedule->course->professor()->first()->userWallet()->first();

        if(@$courseHistory && $schedule->is_cancellable) {
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
            'title'             => getTranslation('title.class.create'),
            'packages'          => $this->coursePackageRepository->getByUserId(auth()->user()->id)
        ])->withViewData([
            'title'             => getTranslation('title.class.create')
        ]);
    }

    public function store($id, CourseRequest $request)
    {
        $courseApplication = $this->courseApplicationRepository->findOrFail($id);
        $course = $this->courseRepository->register($courseApplication, $request);

        if (!is_null(@$request->get('course_package_id'))) {
            $this->coursePackageRepository->addCourseToPackage($request->get('course_package_id'), $course->id);
        }

        $courseApplication->delete();

        return to_route('mypage.course.manage_class.schedules', ['id' => $course->id])->with('success', getTranslation('success.class.create'));
    }

    public function edit($id)
    {
        $course = $this->courseRepository->with(['courseType', 'courseCategory', 'coursePackage'])->findOrFail($id);

        return Inertia::render('Portal/Course/Create', [
            'course'     => $course,
            'categories' => $this->courseCategoryRepository->getDropdownData(),
            'title'      => getTranslation('texts.edit_class'),
            'packages'   => $this->coursePackageRepository->getByUserId(auth()->user()->id)
        ])->withViewData([
            'title'      => getTranslation('texts.edit_class')
        ]);
    }

    public function update($id, CourseRequest $request)
    {
        $course = $this->courseRepository->update($id, $request);

        if (!is_null(@$request->get('course_package_id'))) {
            $this->coursePackageRepository->addCourseToPackage($request->get('course_package_id'), $course->id);
        }

        return to_route('mypage.course.manage_class.schedules', ['id' => $course->id])->with('success', getTranslation('success.class.update'));
    }

    public function createPackage(Request $request)
    {
        $this->coursePackageRepository->create([
            'name' => @$request->name,
            'user_id' => auth()->user()->id
        ]);

        return redirect()->back()->with('success', getTranslation('success.packages.create'));
    }

    public function delete($id)
    {
        $course = $this->courseRepository->findOrFail($id);

        $course->delete();

        return redirect()->back()->with('success', getTranslation('success.class.delete'));
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

    public function attend($course_id, $schedule_id)
    {
        $course = $this->courseRepository->with(['professor', 'courseType', 'coursePackage', 'coursePackage.courses', 'courseCategory', 'exams'])->findOrFail($course_id);
        $schedule = $this->courseScheduleRepository->findOrFail($schedule_id);

        $isBooked = $schedule->students()->where('users.id', auth()->user()->id)->first();

        if (!$isBooked && @$schedule->status != ucwords(Status::ONGOING)) {
            return abort(401);
        }

        if ($isBooked && $isBooked->completed_at != null) {
            return abort(401);
        }

        $activeStep = 0;

        // Check if user already attended zoom class or watched video
        $booking = auth()->user()->courseHistories()
                        ->where('course_id', $course_id)
                        ->where('course_schedule_id', $schedule_id)
                        ->first();

        if ($booking->is_watched && $activeStep == 0) $activeStep++;

        // Check if user already taken exams
        $examTaken = auth()->user()->exams()->where('course_schedule_id', $schedule_id)->get();

        if ($examTaken && $examTaken->count() > 0 && $activeStep > 0) {
            foreach ($examTaken as $exam) {
                $activeStep++;
            }
        }

        // Check if user already given a feedback
        $feedbackGiven = $this->courseFeedbackRepository->isUserHasFeedback(auth()->user()->id, $course_id);

        if (@$feedbackGiven && $activeStep == $course->exams->count() + 1) $activeStep++;

        return Inertia::render('Portal/Course/Attend', [
            'course'      => $course,
            'schedule'    => $schedule,
            'title'       => $course->title,
            'active_step' => $activeStep,
            'booking'     => $booking
        ])->withViewData([
            'title'       => $course->title
        ]);
    }

    public function watch($course_id, $schedule_id)
    {
        $course = $this->courseRepository->with(['professor', 'courseType', 'coursePackage', 'courseCategory', 'exams'])->findOrFail($course_id);
        $schedule = $this->courseScheduleRepository->findOrFail($schedule_id);

        $booking = auth()->user()->courseHistories()
                        ->where('course_id', $course_id)
                        ->where('course_schedule_id', $schedule_id)
                        ->first();

        if (!@$booking) return abort(401);

        return Inertia::render('Portal/Course/Watch', [
            'course'   => $course,
            'schedule' => $schedule,
            'booking'  => $booking,
            'title'    => $course->title
        ])->withViewData([
            'title'    => $course->title
        ]);
    }

    public function doneWatching($course_id, $schedule_id)
    {
        $course = $this->courseRepository->findOrFail($course_id);

        $booking = auth()->user()->courseHistories()
                        ->where('course_id', $course_id)
                        ->where('course_schedule_id', $schedule_id)
                        ->first();

        if (!@$booking) return abort(401);

        $booking->update(['is_watched' => true]);

        return to_route('course.attend.index', ['course_id' => $course_id, 'schedule_id' => $schedule_id])->with(
            'success',
            $course->is_live ? getTranslation('success.live_class.attended') : getTranslation('success.video.watched')
        );
    }

    public function complete($course_id, $schedule_id)
    {
        $booking = auth()->user()->courseHistories()
                        ->where('course_id', $course_id)
                        ->where('course_schedule_id', $schedule_id)
                        ->first();

        if (!@$booking) return abort(401);

        $booking->update(['completed_at' => Carbon::now()]);

        $isBadgeReceived = $this->courseHistoryRepository->feedBadge($booking->id);
        $earnedPoints = $this->giveRewards($course_id, $schedule_id);

        $successMessage = '';

        if ($isBadgeReceived) $successMessage .= getTranslation('success.badge.earn');

        if ($earnedPoints > 0) $successMessage .= ' ' . getTranslation('sucess.points.earn') . $earnedPoints;

        return to_route('course.details', ['id' => $course_id])->with(
            'success',
            $isBadgeReceived ? $successMessage : getTranslation('success.class.compelted')
        );
    }

    private function giveRewards($course_id, $schedule_id)
    {
        $course = $this->courseRepository->with(['courseType', 'professor'])->findOrFail($course_id);

        $courseHistory = auth()->user()->courseHistories()
                        ->where('course_id', $course_id)
                        ->where('course_schedule_id', $schedule_id)
                        ->first();

        if ($course->courseType->type != CourseType::EARN) return 0;

        $userWallet = auth()->user()->userWallet()->first();
        $adminWallet = $this->userRepository->getAdmin()->userWallet()->first();
        $teacherWallet = $course->professor()->first()->userWallet()->first();

        $pointsToGive = $course->points_earned;
        $teacherCommission = (int)($course->points_earned / 100 * ($course->professor()->first()->commission_earn_rate));

        $pointsToGive = $pointsToGive - $teacherCommission;

        // Update admin points
        $newUserPoints =  $userWallet->points + $pointsToGive;
        $this->updateWalletHistory($userWallet, WalletTransactionHistory::EARN, $newUserPoints, $courseHistory);
        $this->updateWallet($userWallet, $newUserPoints);

        $newTeacherPoints = $teacherWallet->points + $teacherCommission;
        $this->updateWalletHistory($teacherWallet, WalletTransactionHistory::COMMISSION, $newTeacherPoints, $courseHistory);
        $this->updateWallet($teacherWallet, $newTeacherPoints);

        $newAdminPoints =  $adminWallet->points - $course->points_earned;
        $this->updateWalletHistory($adminWallet, WalletTransactionHistory::DEDUCT, $newAdminPoints, $courseHistory);
        $this->updateWallet($adminWallet, $newAdminPoints);

        return $pointsToGive;
    }
}
