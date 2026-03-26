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
use App\Http\Controllers\API\TokenRewardController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/purchases/{txHash}/status', [\App\Http\Controllers\API\PurchaseStatusController::class, 'show'])
        ->name('api.purchase.status');
});

Route::post('/auth/login', [AuthController::class, 'authenticate']);

Route::middleware('auth:sanctum')->group(function () {
    Route::delete('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
});

Route::prefix('/applications')->name('applications.')->group(function() {
    Route::post('/teachers/create', [UserController::class, 'create'])->name('teachers.create');
    Route::post('/class/create', [CourseApplicationController::class, 'create'])->name('class.create');
});

Route::prefix('/certificates')->middleware(['auth:sanctum'])->name('certificates.')->group(function() {
    Route::post('/mint-and-airdrop', [CertificateController::class, 'mintAndAirdropCertificates'])->name('mint_airdrop');
    Route::get('/completion-summary', [CertificateController::class, 'getCourseCompletionSummary'])->name('completion_summary');

    // New certificate API endpoints
    Route::post('/courses/{course}/estimate-fee', [CertificateController::class, 'estimateAirdropFee'])->name('estimate_fee');
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
Route::post('/webhook/blockfrost/purchase', [CoursePaymentController::class, 'handlePurchaseWebhook'])
    ->middleware('throttle:webhook')
    ->name('webhook.purchase');

// Stripe payment routes (authenticated)
Route::prefix('/stripe')->middleware(['auth:sanctum'])->name('stripe.')->group(function() {
    Route::post('/payment-intent/{course}', [StripeController::class, 'createPaymentIntent'])
        ->middleware('throttle:payment-intent')
        ->name('payment_intent');
});

// Stripe webhook (no auth, CSRF exempt, signature verified in controller)
Route::post('/stripe/webhook', [StripeController::class, 'webhook'])
    ->middleware('throttle:webhook')
    ->name('stripe.webhook');

// Public course price endpoints
Route::get('/courses/{course}/ada-price', [\App\Http\Controllers\API\CourseController::class, 'getAdaPrice'])
    ->name('api.course.ada_price');

// Public Cardano network status endpoint
Route::get('/cardano/network-status', [\App\Http\Controllers\API\CardanoController::class, 'networkStatus'])
    ->name('api.cardano.network_status');

// Token reward routes (teacher-authenticated)
Route::prefix('/courses')->middleware(['auth:sanctum'])->name('token_reward.')->group(function () {
    Route::put('/{course}/token-reward', [TokenRewardController::class, 'updateConfig'])->name('update_config');
    Route::post('/{course}/token-reward/mint', [TokenRewardController::class, 'mintAndAirdrop'])->name('mint');
});

// Admin refund routes
Route::prefix('admin/refunds')->middleware(['auth:sanctum'])->group(function () {
    Route::post('/stripe/{stripePaymentId}', [\App\Http\Controllers\API\AdminRefundController::class, 'refundStripe'])->name('admin.refunds.stripe');
    Route::post('/ada/{courseHistoryId}', [\App\Http\Controllers\API\AdminRefundController::class, 'refundAda'])->name('admin.refunds.ada');
});

// Admin certificate routes (any course, fees from platform wallet)
Route::prefix('admin/certificates')->middleware(['auth:sanctum'])->name('admin.certificates.')->group(function () {
    Route::post('/courses/{course}/estimate-fee', [\App\Http\Controllers\Admin\CertificateController::class, 'estimateAirdropFee'])->name('estimate_fee');
    Route::get('/courses/{course}/eligible-students', [\App\Http\Controllers\Admin\CertificateController::class, 'getEligibleStudents'])->name('eligible_students');
    Route::post('/courses/{course}/students/{student}/mint', [\App\Http\Controllers\Admin\CertificateController::class, 'mintSingleCertificate'])->name('mint_single');
    Route::post('/courses/{course}/batch-mint', [\App\Http\Controllers\Admin\CertificateController::class, 'batchMintCertificates'])->name('batch_mint');
    Route::get('/courses/{course}/students/{student}/status', [\App\Http\Controllers\Admin\CertificateController::class, 'getCertificateStatus'])->name('certificate_status');
});

