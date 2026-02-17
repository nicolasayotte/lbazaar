<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\BuildPurchaseTxRequest;
use App\Http\Requests\CourseRequest;
use App\Http\Requests\SearchClassRequest;
use App\Http\Requests\SubmitPurchaseTxRequest;
use App\Services\API\CertificateService;
use App\Services\API\CoursePurchaseService;
use App\Services\API\ExchangeRateService;
use App\Mail\CourseBooking;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\NftTransactions;
use App\Models\Setting;
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
use App\Repositories\NftRepository;
use App\Repositories\UserRepository;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public $courseTypeRepository;

    public $courseCategoryRepository;

    public $courseRepository;

    public $courseScheduleRepository;

    public $nftRepository;

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
        $this->nftRepository = new NftRepository();
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
        $nfts = $this->nftRepository->getAll();
        $teachers = $this->userRepository->getAllTeachers();

        $courses = $this->courseRepository->search($request);

        // Add price_in_ada to courses collection
        $exchangeRateService = app(ExchangeRateService::class);
        $exchangeRateService->addPriceInAdaToCourses($courses);

        return Inertia::render('Portal/Course/Search', [
                'course_types'          => $types,
                'course_categories'     => $categories,
                'languages'             => $languages,
                'teachers'              => $teachers,
                'courses'               => $courses,
                'nfts'                  => $nfts,
                'page'                  => @$request['page'] ?? 1,
                'from'                  => @$request['from'] ?? '',
                'to'                    => @$request['to'] ?? '',
                'search_text'           => @$request['search_text'] ?? '',
                'category_ids'          => array_map('intval', @$request['category_ids'] ?? []),
                'type_id'               => @$request['type_id'] ?? '',
                'status'                => @$request['status'] ?? '',
                'language'              => @$request['language'] ?? '',
                'professor_id'          => @$request['professor_id'] ?? '',
                'title'                 => getTranslation('texts.browse_classes')
            ])->withViewData([
                'title'                 => getTranslation('texts.browse_classes'),
            ]);
    }

    public function details($id, Request $request)
    {
        $feedbackCount = @$request['feedback_count'] ?? CourseFeedbackRepository::PER_PAGE;

        $course = $this->courseRepository->findById($id);
        $nftId = $course['nft_id'];
        $nft = isset($nftId) ? $this->nftRepository->getNftById($nftId): null;
        $schedules = $this->courseScheduleRepository->findByCourseId($course->id);
        $feedbacks = $this->courseFeedbackRepository->loadByCourseId($id, $feedbackCount);

        // Add price_in_ada to course
        $exchangeRateService = app(ExchangeRateService::class);
        $exchangeRateService->addPriceInAdaToCourses([$course]);

        return Inertia::render('Portal/Course/Details', [
            'course'           => $course,
            'nft'              => $nft,
            'schedules'        => $schedules,
            'feedbacks'        => $feedbacks,
            'isBooked'         => auth()->user() && auth()->user()->isCourseBooked($id),
            'hasFeedback'      => auth()->user() && auth()->user()->hasFeedback($id),
            'feedbackCount'    => $feedbackCount,
            'feedbacksPerPage' => CourseFeedbackRepository::PER_PAGE,
            'title'            => $course->title,
            'description'      => $course->raw_description,
            'author'           => $course->professor->fullname,
            'keywords'         => implode(', ', array_merge([$course->title], $course->categories->pluck('name')->toArray()))
        ])->withViewData([
            'title'            => $course->title,
            'description'      => $course->raw_description,
            'author'           => $course->professor->fullname,
            'keywords'         => implode(', ', array_merge([$course->title], $course->categories->pluck('name')->toArray()))
        ]);
    }

    public function book($schedule_id)
    {
        $schedule = CourseSchedule::find($schedule_id)->load('course');

        if ($schedule->course->professor_id == auth()->user()->id) {
            return redirect()->back()->with('error', getTranslation('error'));
        }

        $isBooked      = count($this->courseHistoryRepository->findByUserAndCourseScheduleID(auth()->user()->id, $schedule_id)) > 0;
        $isLive        = $schedule->course->is_live;
        $isFullyBooked = $isLive ? count($this->courseHistoryRepository->findByCourseScheduleID($schedule_id)) == $schedule->max_participant : false;

        $userWallet    = auth()->user()->userWallet()->first();
        $adminWallet   = $this->userRepository->getAdmin()->userWallet()->first();
        $teacherWallet = $schedule->course->professor()->first()->userWallet()->first();

        $adminCommissionSettings = Setting::where('slug', 'admin-commission')->first();
        $userId = auth()->user()->id;
        $nftId = $schedule->course->nft_id;

        $nft = isset($nftId) ? $this->nftRepository->getNftById($nftId): null;

        $hasNft = isset($nft) ? NftTransactions::where('user_id', $userId)
                                   -> where('nft_name', $nft->name)
                                   -> where('used', 0)->first() : null;

        $nftBurnt = isset($hasNft) ? NftTransactions::where('nft_name', $nft->name)
                                    ->where('serial_num', $hasNft->serial_num)
                                    ->where('used', 1)->first() : null;

        // If NFT has been burnt, notify user that it has already been used
        if (isset($nftBurnt)) {
            return redirect()->back()->with('error', getTranslation('nft_error.used'));
        }

        if (!$isBooked && !$isFullyBooked &&
            $schedule->course->course_type_id == 4 &&
            isset($hasNft) && !isset($nftBurnt)) {
            $courseHistory = CourseHistory::create([
                'course_schedule_id' => $schedule->id,
                'course_id'          => $schedule->course->id,
                'user_id'            => auth()->user()->id,
            ]);
            $this->sendBookEmailCourse($schedule);

            $nftTrans = NftTransactions::updateOrCreate(
                [
                    'user_id'      => $userId,
                    'nft_name'     => $nft->name,
                    'serial_num'   => $hasNft->serial_num
                ],
                [
                    'user_id'      => $userId,
                    'nft_name'     => $nft->name,
                    'serial_num'   => $hasNft->serial_num,
                    'course_id'    => $schedule->course->id,
                    'schedule_id'  => $schedule->id,
                    'used'         => 1
                ]);


        } else if (!$isBooked && !$isFullyBooked &&
                    $schedule->course->course_type_id != 4 &&
                    ($userCardanoWallet->ada >= $schedule->course->price)) {

            $courseHistory = CourseHistory::create([
                'course_schedule_id' => $schedule->id,
                'course_id'          => $schedule->course->id,
                'user_id'            => auth()->user()->id,
            ]);

            $this->sendBookEmailCourse($schedule);

            if ($schedule->course->courseType->type != CourseType::FREE) {
                // TODO make this transaction with Ada
                return redirect()->back()->withErrors([
                    'error' => getTranslation('error')
                ]);


                // TODO there is already something for this
                $userAda =  $userCardanoWallet->ada - $schedule->course->price;

                $teacherCommission = (int)($schedule->course->price / 100 * ($schedule->course->professor()->first()->commission_rate));
                $teacherCommission = $schedule->course->price - $adminCommission;
                $adminCommission = $schedule->course->price - $teacherCommission;
                $adminCommission = (int)($schedule->course->price / 100 * $adminCommissionSettings->value);

                $tx = CardanoTransaction::create(userCardanowallet,
                    [
                        [$userAda, $userCardanoWallet->addr],
                        [$teacherCommission, $teacherCardanoWallet->addr],
                        [$adminCommission, $adminCardanoWallet->addr],
                    ]
                );


                // TODO make sure this is returned somewhere we can sign it
                return $tx;
            }

        } else {
            return redirect()->back()->withErrors([
                'error' => getTranslation('error')
            ]);
        }

        return redirect()->back();
    }

    /**
     * Build unsigned purchase transaction for ADA payment
     */
    public function buildPurchaseTx($schedule_id, BuildPurchaseTxRequest $request)
    {
        $schedule = CourseSchedule::findOrFail($schedule_id)->load('course');

        $purchaseService = app(CoursePurchaseService::class);
        $result = $purchaseService->buildPurchaseTransaction($schedule, auth()->user());

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Submit signed purchase transaction
     */
    public function submitPurchaseTx($schedule_id, SubmitPurchaseTxRequest $request)
    {
        $schedule = CourseSchedule::findOrFail($schedule_id)->load('course');

        $purchaseService = app(CoursePurchaseService::class);
        $result = $purchaseService->submitPurchaseTransaction(
            $schedule,
            auth()->user(),
            $request->input('cborSig'),
            $request->input('cborTx')
        );

        if ($result['success']) {
            $this->sendBookEmailCourse($schedule);
        }

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    public function cancel($schedule_id)
    {
        $courseHistory = $this->courseHistoryRepository->findByUserAndCourseScheduleID(auth()->user()->id, $schedule_id)->first();
        $schedule = CourseSchedule::find($schedule_id)->load('course');
        $userWallet = auth()->user()->userWallet()->first();
        $adminWallet = $this->userRepository->getAdmin()->userWallet()->first();
        $teacherWallet = $schedule->course->professor()->first()->userWallet()->first();

        if(isset($courseHistory) && $schedule->is_cancellable) {
            // Earn type kept for backwards compatibility with existing courses
            if ($schedule->course->courseType->name == CourseType::GENERAL ||
                $schedule->course->courseType->name == CourseType::EARN) {

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
            } else if ($schedule->course->courseType->name == CourseType::SPECIAL) {

                NftTransactions::where('user_id', auth()->user()->id)
                                ->where('nft_id', $schedule->course->nft_id)
                                ->where('course_id', $schedule->course->id)
                                ->where('schedule_id', $schedule_id)
                                ->where('used', 1)
                                ->delete();
            }
            $courseHistory->update([
                'is_cancelled' => true,
            ]);

        } else {
            return redirect()->back()->withErrors([
                'error' => getTranslation('error')
            ]);
        }

        return redirect()->back();
    }

    public function create($id)
    {
        $courseApplication = $this->courseApplicationRepository->findOneApproved($id);
        $nftId = $courseApplication['nft_id'];
        return Inertia::render('Portal/Course/Create', [
            'courseApplication' => $courseApplication,
            'categories'        => $this->courseCategoryRepository->getDropdownData(),
            'nft'               => $this->nftRepository->getNftById($nftId),
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
        $course = $this->courseRepository->with(['courseType', 'categories', 'coursePackage'])->findOrFail($id);
        $nftId = $course['nft_id'];
        return Inertia::render('Portal/Course/Create', [
            'course'     => $course,
            'nft'        => $this->nftRepository->getNftById($nftId),
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

    public function updateWalletHistory($userWallet, $transactionType, $newUserPoints, $courseHistory, $courseSchedule = null, $user = null) {
        WalletTransactionHistory::create([
            'user_wallet_id' => $userWallet->id,
            'course_history_id' => isset($courseHistory->id) ? $courseHistory->id : null,
            'course_schedule_id' => isset($courseSchedule->id) ? $courseSchedule->id : null,
            'user_id' => isset($user->id) ? $user->id : null,
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
        $course = $this->courseRepository->with(['professor', 'courseType', 'coursePackage', 'coursePackage.courses', 'categories', 'exams'])->findOrFail($course_id);
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

        if (@$feedbackGiven && $activeStep == $course->examsPublished->count() + 1) $activeStep++;

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
        $course = $this->courseRepository->with(['professor', 'courseType', 'coursePackage', 'categories', 'exams'])->findOrFail($course_id);
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

        if ($earnedPoints > 0) $successMessage .= ' ' . getTranslation('success.points.earn') . $earnedPoints;

        return to_route('course.details', ['id' => $course_id])->with(
            'success',
            $isBadgeReceived ? $successMessage : getTranslation('success.class.completed')
        );
    }

    private function giveRewards($course_id, $schedule_id)
    {
        // Points system removed from UI. Earn courses can no longer be created,
        // but existing courses remain functional. Always returns 0.
        return 0;
    }

    public function sendBookEmailCourse($schedule)
    {
        $user = auth()->user();

        $url = route('course.attend.index', ['course_id' => $schedule->course->id, 'schedule_id' => $schedule->id]);

        try {
            Mail::send(new CourseBooking($schedule, $user, $url));
        } catch (\Exception $e) {
            Log::error($e);
        }
    }

    public function completeConfirmation($course_id, $schedule_id)
    {
        if (!auth()->user()->isCourseBooked($course_id))
        {
            return redirect()->route('course.details', ['id' => $course_id]);
        }

        $course = $this->courseRepository->findOrFail($course_id)->load('professor');
        $schedule = $this->courseScheduleRepository->findOrFail($schedule_id);

        // Get certificate status for this course/schedule if certificate enabled
        $certificateData = null;

        if ($course->certificate_enabled) {
            $certificateService = app(CertificateService::class);
            $certificateData = $certificateService->getCertificateDataForCompletion(
                $course_id,
                auth()->id(),
                $schedule_id
            );
        }

        return Inertia::render('Portal/CourseCompleteConfirmation', [
            'course'      => $course,
            'schedule'    => $schedule,
            'certificate' => $certificateData,
            'title'       => getTranslation('texts.complete_class')
        ])->withViewData([
            'title' => getTranslation('texts.complete_class')
        ]);
    }

    public function sendDonation(Request $request)
    {
        $inputs = $request->all();
        $schedule = CourseSchedule::find($inputs['schedule_id'])->load('course');
        $teacherWallet = $schedule->course->professor()->first()->userWallet()->first();
        $userWallet = auth()->user()->userWallet()->first();
        $donationCommissionSettings = Setting::where('slug', 'donate-commission')->first();
        $adminWallet = $this->userRepository->getAdmin()->userWallet()->first();

        if ($userWallet->points >= $inputs['points']) {

            $newUserPoints =  $userWallet->points - $inputs['points'];
            $this->updateWalletHistory($userWallet, WalletTransactionHistory::DONATE, $newUserPoints, null, $schedule, $schedule->course->professor()->first());
            $this->updateWallet($userWallet, $newUserPoints);

            $adminCommission = (int)($inputs['points'] / 100 * $donationCommissionSettings->value);
            $newAdminPoints =  $adminWallet->points + $adminCommission;
            $this->updateWalletHistory($adminWallet, WalletTransactionHistory::COMMISSION, $newAdminPoints,  null, $schedule);
            $this->updateWallet($adminWallet, $newAdminPoints);

            $newTeacherPoints = $teacherWallet->points + ($inputs['points'] - $adminCommission);
            $this->updateWalletHistory($teacherWallet, WalletTransactionHistory::DONATE, $newTeacherPoints,  null, $schedule, auth()->user());
            $this->updateWallet($teacherWallet, $newTeacherPoints);

        } else {
            return redirect()->back()->withErrors([
                'error' => getTranslation('error')
            ]);
        }

        return redirect()->back()->with('success', getTranslation('success.class.donated'));
    }
}
