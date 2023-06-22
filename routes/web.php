<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ClassificationController;
use App\Http\Controllers\Admin\CourseApplicationController;
use App\Http\Controllers\Admin\CourseCategoryController;
use App\Http\Controllers\Admin\CourseTypeController;
use App\Http\Controllers\Admin\InquiriesController as AdminInquiriesController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\TranslationController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\WalletTransactionHistoryController as AdminWalletController;
use App\Http\Controllers\Portal\AuthPortalController;
use App\Http\Controllers\Portal\CourseApplicationController as PortalClassApplicationController;
use App\Http\Controllers\Portal\CourseController;
use App\Http\Controllers\Portal\CourseFeedbackController;
use App\Http\Controllers\Portal\CourseHistoryController;
use App\Http\Controllers\Portal\CourseScheduleController;
use App\Http\Controllers\Portal\UserBadgeController;
use App\Http\Controllers\Portal\ExamController;
use App\Http\Controllers\Portal\ForgotPasswordController;
use App\Http\Controllers\Portal\InquiriesController;
use App\Http\Controllers\Portal\WalletTransactionHistoryController as PortalWalletTransactionHistoryController;
use App\Http\Controllers\Portal\ManageCourseController;
use App\Http\Controllers\Portal\ProfileController as PortalProfileController;
use App\Http\Controllers\Portal\RegisterStudentController;
use App\Http\Controllers\Portal\RegisterTeacherController;
use App\Http\Controllers\Portal\TopPageController;
use App\Http\Controllers\Portal\UserController as PortalUserController;
use App\Http\Controllers\Portal\Web3WalletController;
use Illuminate\Http\Request;
use Illuminate\Mail\Markdown;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/


# Top Page
Route::get('/', [TopPageController::class, 'index'])->name('top');

# Set Locale
Route::get('lang/{locale}', [TopPageController::class, 'setLanguage'])->name('language.set');

# Inquiries
Route::get('/inquiries', [InquiriesController::class, 'index'])->name('inquiries.index');
Route::post('/inquiries', [InquiriesController::class, 'store'])->name('inquiries.store');

# Admin Routes
Route::prefix('admin')->name('admin.')->group(function() {

    Route::get('/', function(Request $request) {
        return redirect()->route(@$request->user() ? 'admin.profile.index' : 'admin.login');
    });

    # Authentication
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/authenticate', [AuthController::class, 'authenticate'])->name('authenticate');

    Route::middleware(['auth', 'admin'])->group(function() {
        # Logout
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        # Profile
        Route::prefix('profile')->name('profile.')->group(function() {
            Route::get('/', [ProfileController::class, 'index'])->name('index');
            Route::patch('/', [ProfileController::class, 'update'])->name('update');
        });

        # admin wallet
        Route::get('/wallet-history', [AdminWalletController::class, 'index'])->name('wallet.index');

        # Inquiries
        Route::prefix('inquiries')->name('inquiries.')->group(function() {
            Route::get('/', [AdminInquiriesController::class, 'index'])->name('index');
            Route::get('/{id}', [AdminInquiriesController::class, 'view'])->name('view');
        });

        # Users
        Route::prefix('users')->name('users.')->group(function() {
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::get('/export', [UserController::class, 'exportCsv'])->name('export');
            Route::get('/create', [UserController::class, 'create'])->name('create');
            Route::post('/', [UserController::class, 'store'])->name('store');
            Route::get('/{id}', [UserController::class, 'view'])->name('view');
            Route::post('/{id}/status/{status}', [UserController::class, 'updateStatus'])->name('status.update');
        });

        # Class Applications
        Route::prefix('class-applications')->name('class.applications.')->group(function() {
            Route::get('/', [CourseApplicationController::class, 'index'])->name('index');
            Route::get('/{id}', [CourseApplicationController::class, 'view'])->name('view');
            Route::patch('/{id}/status/{status}', [CourseApplicationController::class, 'updateStatus'])->name('status.update');
        });

        # Settings
        Route::prefix('settings')->name('settings.')->group(function() {

            # Categories
            Route::prefix('categories')->name('categories.')->group(function() {
                Route::get('/', [CourseCategoryController::class, 'index'])->name('index');
                Route::post('/', [CourseCategoryController::class, 'store'])->name('store');
                Route::patch('/{id}', [CourseCategoryController::class, 'update'])->name('update');
                Route::delete('/{id}', [CourseCategoryController::class, 'delete'])->name('delete');
            });

            # Course Types
            Route::prefix('class-types')->name('course_types.')->group(function() {
                Route::get('/', [CourseTypeController::class, 'index'])->name('index');
                Route::patch('/update', [CourseTypeController::class, 'update'])->name('update');
            });

            # Classifications
            Route::prefix('classifications')->name('classifications.')->group(function() {
                Route::get('/', [ClassificationController::class, 'index'])->name('index');
                Route::post('/', [ClassificationController::class, 'store'])->name('store');
                Route::patch('/{id}/update', [ClassificationController::class, 'update'])->name('update');
                Route::delete('/{id}/delete', [ClassificationController::class, 'delete'])->name('delete');
            });

            # Translations
            Route::prefix('translations')->name('translations.')->group(function() {
                Route::get('/', [TranslationController::class, 'index'])->name('index');
                Route::patch('/', [TranslationController::class, 'update'])->name('update');
            });

            # Translations
            Route::prefix('general')->name('general.')->group(function() {
                Route::get('/', [SettingsController::class, 'index'])->name('index');
                Route::post('/', [SettingsController::class, 'update'])->name('update');
            });


        });
    });
});

# Courses
Route::prefix('classes')->name('course.')->group(function() {
    Route::get('/', [CourseController::class, 'index'])->name('index');
    Route::get('/{id}', [CourseController::class, 'details'])->name('details');

    Route::middleware('auth')->group(function() {

        # Course Booking
        Route::post('/{schedule_id}/book', [CourseController::class, 'book'])->name('book');
        Route::post('/{schedule_id}/cancel', [CourseController::class, 'cancel'])->name('cancel');

        #send donation
        Route::post('/send-donation', [CourseController::class, 'sendDonation'])->name('send.donation');

        # Feedback Edit/Update
        Route::prefix('/feedbacks')->name('feedbacks.')->group(function() {
            Route::get('/{id}/edit', [CourseFeedbackController::class, 'edit'])->name('edit');
            Route::patch('/{id}/update', [CourseFeedbackController::class, 'update'])->name('update');
        });

        Route::middleware(['auth', 'teacher'])->group(function() {
            # Edit Course
            Route::get('/{id}/edit', [CourseController::class, 'edit'])->name('edit');
            Route::post('/{id}/update', [CourseController::class, 'update'])->name('update');

            # Create Course
            Route::get('/{id}/create', [CourseController::class, 'create'])->name('create');
            Route::post('/{id}/store', [CourseController::class, 'store'])->name('store');

            # Create Package
            Route::post('/package/create', [CourseController::class, 'createPackage'])->name('package.create');

            # Delete
            Route::delete('/{id}/delete', [CourseController::class, 'delete'])->name('delete');
        });
    });
});

# User Registration
Route::prefix('register')->name('register.')->group(function() {
    Route::get('/', [AuthPortalController::class, 'register'])->name('index');

    Route::get('/student', [RegisterStudentController::class, 'index'])->name('student');
    Route::post('/student', [RegisterStudentController::class, 'store'])->name('store');

    Route::get('/teacher', [RegisterTeacherController::class, 'index'])->name('teacher');
    Route::post('/teacher', [RegisterTeacherController::class, 'store'])->name('teacher.store');

    Route::get('/teacher/success', [RegisterTeacherController::class, 'success'])->name('teacher.success');
});

# Portal Routes
Route::prefix('portal')->name('portal.')->group(function() {

    Route::get('/', function(Request $request) {
        return redirect()->route(@$request->user() ? 'verify.email' : 'portal.login');
    });

    # Portal Authentication
    Route::get('/login', [AuthPortalController::class, 'login'])->name('login');
    Route::post('/authenticate', [AuthPortalController::class, 'authenticate'])->name('authenticate');
    Route::get('/update-temp-password', [AuthPortalController::class, 'updateTempPassword'])->name('update.temp.password');
    Route::middleware(['auth'])->group(function() {
        # Logout
        Route::post('/logout', [AuthPortalController::class, 'logout'])->name('logout');
    });

    # Users
    Route::prefix('users')->name('users.')->group(function() {
        Route::get('/{id}', [PortalUserController::class, 'view'])->name('view');
    });
});

# Email verification
Route::get('/email/verify', [RegisterStudentController::class, 'verifyEmail'])->name('verify.email');
Route::get('/email/verify/{id}/{hash}', [RegisterStudentController::class, 'verificationHanlder'])->middleware(['signed'])->name('verification.verify');
Route::get('/email/resend', [RegisterStudentController::class, 'resendEmailVerification'])->name('resend.email')->middleware(['auth', 'throttle:6,1'])->name('verification.send');

# Forgot Password
Route::get('/forgot-password', [ForgotPasswordController::class, 'index'])->name('forgot.password.index');
Route::post('/forgot-password', [ForgotPasswordController::class, 'validateEmail'])->name('forgot.password.store');
Route::get('/reset-password/{token}', [ForgotPasswordController::class, 'passwordReset'])->middleware('guest')->name('password.reset');
Route::patch('/reset-password/{token}', [ForgotPasswordController::class, 'updatePassword'])->middleware('guest')->name('password.reset.update');

# Mail layout viewer
# FOR TESTING ONLY
Route::get('/mail', function() {
    $markdown = new Markdown(view(), config('mail.markdown'));

    # The view file that you wish to preview
    $view = '';

    # The data that you need to pass to the view
    $data = [];

    # render() method expects 2 parameters - view and data
    return $markdown->render($view, $data);
});

# Profile
Route::prefix('mypage')->middleware(['auth'])->name('mypage.')->group(function() {

    Route::get('/', function(Request $request) {
        return redirect()->route(@$request->user() ? 'mypage.profile.index' : 'portal.login');
    });

    # Profile
    Route::get('/profile', [PortalProfileController::class, 'index'])->name('profile.index');
    Route::post('/profile', [PortalProfileController::class, 'update'])->name('profile.update');
    Route::patch('/password/update', [PortalProfileController::class, 'updatePassword'])->name('profile.password.update');
    Route::patch('/base-password/update', [PortalProfileController::class, 'updateBasePassword'])->name('profile.base.password.update');

    # Points
    Route::prefix('/points')->name('points.')->group(function() {
        Route::post('/feed', [PortalProfileController::class, 'feedPointsToWallet'])->name('feed');
        Route::post('/exchange', [PortalProfileController::class, 'exchangeToNFTRequest'])->name('exchange');
    });

    # Class History
    Route::get('/class-history', [CourseHistoryController::class, 'index'])->name('course.history.index');

    # Wallet Transactions
    Route::get('/wallet-history', [PortalWalletTransactionHistoryController::class, 'index'])->name('wallet.history.index');

    # user badges
    Route::prefix('/badges')->name('badges.')->group(function() {
        Route::get('/claimAll', [UserBadgeController::class, 'claimAllBadges'])->name('claimAll');
        Route::get('/', [UserBadgeController::class, 'index'])->name('index');
    });


    # request retake User exam
    Route::get('/user-exam/{user_exam_id}/retake', [ExamController::class, 'sendRetakeRequestUserExam'])->name('user_exam.retake');

    # teacher schedule
    Route::get('/schedules', [CourseScheduleController::class, 'teacherSchedules'])->name('schedules');

    # Class Applications
    Route::prefix('/class-application')->middleware(['teacher'])->name('course.applications.')->group(function() {
        Route::get('/', [PortalClassApplicationController::class, 'index'])->name('index');
        Route::get('/create', [PortalClassApplicationController::class, 'create'])->name('create');
        Route::post('/', [PortalClassApplicationController::class, 'store'])->name('store');
        Route::get('/details/{id}', [PortalClassApplicationController::class, 'view'])->name('view');
        Route::post('/generate', [PortalClassApplicationController::class, 'generate'])->name('generate');
    });

    # Manage Classes
    Route::prefix('/manage-class')->middleware(['teacher'])->name('course.manage_class.')->group(function() {

        Route::get('/', [ManageCourseController::class, 'index'])->name('index');

        # Manage Class Details
        Route::prefix('/{id}')->group(function() {
            Route::get('/feedbacks', [ManageCourseController::class, 'feedbacks'])->name('feedbacks');
            Route::get('/exams', [ExamController::class, 'index'])->name('exams');
            Route::get('/schedules', [CourseScheduleController::class, 'index'])->name('schedules');
        });
    });
});

# Exams
Route::prefix('exams')->name('exams.')->group(function() {

    Route::middleware(['auth', 'teacher'])->group(function() {

        Route::prefix('/{id}')->group(function() {
            # Create
            Route::get('/create', [ExamController::class, 'create'])->name('create');
            Route::post('/', [ExamController::class, 'store'])->name('store');

            # Edit
            Route::get('/edit', [ExamController::class, 'edit'])->name('edit');
            Route::patch('/update', [ExamController::class, 'update'])->name('update');

            # Update Status / Delete
            Route::patch('/status/{status}', [ExamController::class, 'toggleStatus'])->name('status.toggle');
            Route::delete('/delete', [ExamController::class, 'delete'])->name('delete');
        });

        # Delete User Exam
        Route::delete('/answers/{id}/delete', [ExamController::class, 'deleteUserExam'])->name('answers.delete');
    });
});

# Schedules
Route::prefix('schedules')->name('schedules.')->group(function() {

    Route::prefix('/{id}')->middleware(['auth', 'teacher'])->group(function() {
        # View
        Route::get('/', [CourseScheduleController::class, 'view'])->name('view');

        # Create
        Route::get('/create', [CourseScheduleController::class, 'create'])->name('create');
        Route::post('/', [CourseScheduleController::class, 'store'])->name('store');

        # Update Status
        Route::patch('/status/update', [CourseScheduleController::class, 'updateStatus'])->name('status.update');

        # Delete
        Route::delete('/delete', [CourseScheduleController::class, 'delete'])->name('delete');

        # Student View
        Route::get('/students/{student_id}', [CourseScheduleController::class, 'viewStudent'])->name('student.view');
    });
});

# Attend Classes
Route::prefix('classes/{course_id}/attend/{schedule_id}')->middleware(['auth'])->name('course.attend.')->group(function() {

    # Attend
    Route::get('/', [CourseController::class, 'attend'])->name('index');

    # Watch
    Route::get('/watch', [CourseController::class, 'watch'])->name('watch');
    Route::post('watch/done', [CourseController::class, 'doneWatching'])->name('watch.done');

    # Exams
    Route::prefix('/exams/{id}')->name('exams.')->group(function() {
        Route::get('/', [ExamController::class, 'view'])->name('view');
        Route::post('/', [ExamController::class, 'submit'])->name('submit');
        Route::get('/result', [ExamController::class, 'result'])->name('result');
    });

    # Course Feedback
    Route::get('/feedback', [CourseFeedbackController::class, 'create'])->name('feedback.create');
    Route::post('/feedback', [CourseFeedbackController::class, 'store'])->name('feedback.store');

    # Complete
    Route::post('/complete', [CourseController::class, 'complete'])->name('complete');

     # complete confirmation
     Route::get('/complete-confirmation', [CourseController::class, 'completeConfirmation'])->name('complete.confirmation');
});

# Web3 Connect Wallet
Route::middleware('auth')->group(function() {
    Route::prefix('/wallet')->name('wallet')->group(function() {
        Route::post('/info', [Web3WalletController::class, 'info'])->name('info');
        Route::post('/verify', [Web3WalletController::class, 'verify'])->name('verify');
        Route::post('/build-exchange-tx', [Web3WalletController::class, 'buildExchangeTx'])->name('buildExchangeTx');
        Route::post('/submit-exchange-tx', [Web3WalletController::class, 'submitExchangeTx'])->name('submitExchangeTx');
        Route::post('/build-feed-tx', [Web3WalletController::class, 'buildFeedTx'])->name('buildFeedTx');
        Route::post('/submit-feed-tx', [Web3WalletController::class, 'submitFeedTx'])->name('submitFeedTx');
        Route::post('/feed', [Web3WalletController::class, 'feed'])->name('feed');
    });
});
