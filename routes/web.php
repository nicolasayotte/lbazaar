<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Portal\CourseController;
use App\Http\Controllers\Portal\InquiriesController;
use App\Http\Controllers\Portal\TopPageController;
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
Route::get('/', [TopPageController::class, 'index'])->name('top');

Route::get('/inquiries', [InquiriesController::class, 'index'])->name('inquiries.index');
Route::post('/inquiries', [InquiriesController::class, 'store'])->name('inquiries.store');

Route::prefix('admin')->name('admin.')->group(function() {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/authenticate', [AuthController::class, 'authenticate'])->name('authenticate');
});
Route::get('/course', [CourseController::class, 'index']);
