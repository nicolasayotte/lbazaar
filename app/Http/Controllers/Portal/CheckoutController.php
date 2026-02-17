<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\StripePayment;
use App\Services\API\ExchangeRateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function success(Request $request)
    {
        $courseId = $request->query('course_id');
        $paymentIntentId = $request->query('payment_intent');

        $course = $courseId ? Course::find($courseId) : null;
        $payment = $paymentIntentId
            ? StripePayment::where('stripe_payment_intent_id', $paymentIntentId)->first()
            : null;

        // Authorization check: Ensure user can only view their own payment records
        if ($payment && $payment->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to payment record');
        }

        // Add price_in_ada to course if present
        if ($course) {
            $exchangeRateService = app(ExchangeRateService::class);
            $exchangeRateService->addPriceInAdaToCourses([$course]);
        }

        return Inertia::render('Portal/Checkout/Success', [
            'course' => $course,
            'payment' => $payment,
            'title' => getTranslation('texts.payment_successful'),
        ])->withViewData([
            'title' => getTranslation('texts.payment_successful'),
        ]);
    }

    public function cancel(Request $request)
    {
        $courseId = $request->query('course_id');
        $course = $courseId ? Course::find($courseId) : null;

        // Add price_in_ada to course if present
        if ($course) {
            $exchangeRateService = app(ExchangeRateService::class);
            $exchangeRateService->addPriceInAdaToCourses([$course]);
        }

        return Inertia::render('Portal/Checkout/Cancel', [
            'course' => $course,
            'title' => getTranslation('texts.payment_cancelled'),
        ])->withViewData([
            'title' => getTranslation('texts.payment_cancelled'),
        ]);
    }
}
