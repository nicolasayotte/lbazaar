<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ClassApplicationController;
use App\Http\Controllers\Admin\CourseApplicationController;
use App\Http\Controllers\Admin\InquiriesController as AdminInquiriesController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Portal\ProfileController as PortalProfileController;
use App\Http\Controllers\Portal\AuthPortalController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Portal\CourseController;
use App\Http\Controllers\Portal\ForgotPasswordController;
use App\Http\Controllers\Portal\InquiriesController;
use App\Http\Controllers\Portal\RegisterStudentController;
use App\Http\Controllers\Portal\TopPageController;
use App\Models\CourseApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Mail\Markdown;

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

        # Inquiries
        Route::prefix('inquiries')->name('inquiries.')->group(function() {
            Route::get('/', [AdminInquiriesController::class, 'index'])->name('index');
            Route::get('/{id}', [AdminInquiriesController::class, 'view'])->name('view');
        });

        # Users
        Route::prefix('users')->name('users.')->group(function() {
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::get('/create', [UserController::class, 'create'])->name('create');
            Route::post('/', [UserController::class, 'store'])->name('store');
            Route::get('/{id}', [UserController::class, 'view'])->name('view');
            Route::post('/{id}/status/{status}', [UserController::class, 'updateStatus'])->name('status.update');
        });

        # Class Applications
        Route::prefix('class-applications')->name('class.applications.')->group(function() {
            Route::get('/', [CourseApplicationController::class, 'index'])->name('index');
            Route::patch('/{id}/status/{status}', [CourseApplicationController::class, 'updateStatus'])->name('status.update');
        });
    });
});

# Courses
Route::prefix('courses')->name('course.')->group(function() {
    Route::get('/', [CourseController::class, 'index'])->name('index');
    Route::get('/details/{id}', [CourseController::class, 'details'])->name('details');
});

# User Registration
Route::prefix('register')->name('register.')->group(function() {
    Route::get('/student', [RegisterStudentController::class, 'index'])->name('index');
    Route::post('/student', [RegisterStudentController::class, 'store'])->name('store');
});

# Portal Routes
Route::prefix('portal')->name('portal.')->group(function() {

    Route::get('/', function(Request $request) {
        return redirect()->route(@$request->user() ? 'verify.email' : 'portal.login');
    });

    # Portal Authentication
    Route::get('/login', [AuthPortalController::class, 'login'])->name('login');
    Route::post('/authenticate', [AuthPortalController::class, 'authenticate'])->name('authenticate');

    Route::middleware(['auth'])->group(function() {
        # Logout
        Route::post('/logout', [AuthPortalController::class, 'logout'])->name('logout');
    });

});

# Email verification
Route::get('/email/verify', [RegisterStudentController::class, 'verifyEmail'])->name('verify.email');
Route::get('/email/verify/{id}/{hash}', [RegisterStudentController::class, 'verificationHanlder'])->middleware(['auth', 'signed'])->name('verification.verify');
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

    // render() method expects 2 parameters - view and data
    return $markdown->render($view, $data);
});

# Profile
Route::prefix('mypage')->middleware(['auth'])->name('mypage.')->group(function() {
    Route::get('/', function(Request $request) {
        return redirect()->route(@$request->user() ? 'mypage.profile.index' : 'portal.login');
    });

    Route::get('/profile', [PortalProfileController::class, 'index'])->name('profile.index');
    Route::patch('/profile', [PortalProfileController::class, 'update'])->name('profile.update');
    Route::patch('/password/update', [PortalProfileController::class, 'updatePassword'])->name('profile.password.update');
});
