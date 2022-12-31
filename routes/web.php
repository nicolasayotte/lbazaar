<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Portal\AuthPortalController;
use App\Http\Controllers\Portal\CourseController;
use App\Http\Controllers\Portal\InquiriesController;
use App\Http\Controllers\Portal\RegisterStudentController;
use App\Http\Controllers\Portal\TopPageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Profiler\Profile;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

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
Route::get('/', [TopPageController::class, 'index'])->name('top');

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

        Route::patch('/password/update', [ProfileController::class, 'update_password'])->name('password.update');
    });
});

Route::prefix('courses')->name('course.')->group(function() {
    Route::get('/', [CourseController::class, 'index'])->name('index');
    Route::get('/details/{id}', [CourseController::class, 'details'])->name('details');
});

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
# Email verification notice
Route::get('/email/verify', [RegisterStudentController::class, 'verifyEmail'])->name('verify.email');

# Email verification handler
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return redirect('/');
})->middleware(['auth', 'signed'])->name('verification.verify');

# Resending The Verification Email
Route::get('/email/resend', [RegisterStudentController::class, 'resendEmailVerification'])->name('resend.email')->middleware(['auth', 'throttle:6,1'])->name('verification.send');






