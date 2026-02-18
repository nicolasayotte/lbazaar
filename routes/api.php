<?php

use App\Models\Country;
use App\Models\Course;
use App\Models\CourseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\UserWalletController;
use App\Http\Controllers\API\CourseApplicationController;
use App\Http\Controllers\API\VoteController;
use App\Http\Controllers\API\CertificateController;
use App\Http\Controllers\API\CoursePaymentController;
use App\Http\Controllers\API\StripeController;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/


Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    // Return authenticated user with linked wallet
    $user = $request->user()->load('userWallet');
    return response()->json($user);
});

Route::post('/auth/login', [AuthController::class, 'authenticate']);

Route::prefix('/points')->name('points.')->group(function() {
    Route::post('/feed', [UserWalletController::class, 'feed'])->name('feed');
    Route::post('/exchange', [UserWalletController::class, 'exchange'])->name('exchange');
});

Route::prefix('/applications')->name('points.')->group(function() {
    Route::post('/teachers/create', [UserController::class, 'create'])->name('teachers.create');
    Route::post('/class/create', [CourseApplicationController::class, 'create'])->name('class.create');
});

Route::prefix('/certificates')->middleware(['auth:sanctum'])->name('certificates.')->group(function() {
    Route::post('/mint-and-airdrop', [CertificateController::class, 'mintAndAirdropCertificates'])->name('mint_airdrop');
    Route::get('/completion-summary', [CertificateController::class, 'getCourseCompletionSummary'])->name('completion_summary');

    // New certificate API endpoints
    Route::get('/courses/{course}/eligible-students', [CertificateController::class, 'getEligibleStudents'])->name('eligible_students');
    Route::post('/courses/{course}/students/{student}/mint', [CertificateController::class, 'mintSingleCertificate'])->name('mint_single');
    Route::post('/courses/{course}/batch-mint', [CertificateController::class, 'batchMintCertificates'])->name('batch_mint');
    Route::get('/courses/{course}/students/{student}/status', [CertificateController::class, 'getCertificateStatus'])->name('certificate_status');
});

Route::get('/categories',  function (Request $request) {
    return CourseCategory::all()->makeHidden(['created_at', 'updated_at', 'deleted_at']);
});
Route::get('/countries',  function (Request $request) {
    return Country::all()->makeHidden(['created_at', 'updated_at']);
});

Route::post('/votes/register', [VoteController::class, 'register'])->name('votes.register');

// Blockfrost Webhooks
Route::post('/webhook/blockfrost/purchase', [CoursePaymentController::class, 'handlePurchaseWebhook'])->name('webhook.purchase');

// Stripe payment routes (authenticated)
Route::prefix('/stripe')->middleware(['auth:sanctum'])->name('stripe.')->group(function() {
    Route::post('/payment-intent/{course}', [StripeController::class, 'createPaymentIntent'])
        ->middleware('throttle:payment-intent')
        ->name('payment_intent');
});

// Stripe webhook (no auth, CSRF exempt, signature verified in controller)
Route::post('/stripe/webhook', [StripeController::class, 'webhook'])->name('stripe.webhook');

