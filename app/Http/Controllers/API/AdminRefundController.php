<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminAdaRefundRequest;
use App\Http\Requests\AdminStripeRefundRequest;
use App\Models\CourseHistory;
use App\Models\StripePayment;
use App\Services\API\CoursePurchaseService;
use App\Services\API\StripeService;

class AdminRefundController extends Controller
{
    public function __construct(
        protected StripeService $stripeService,
        protected CoursePurchaseService $coursePurchaseService,
    ) {}

    public function refundStripe(AdminStripeRefundRequest $request, string $stripePaymentId): \Illuminate\Http\JsonResponse
    {
        $payment = StripePayment::where('stripe_payment_intent_id', $stripePaymentId)->firstOrFail();
        $result = $this->stripeService->refund($payment, ['force' => (bool) $request->input('force', false)]);
        return response()->json($result, $result['success'] ? 200 : 400);
    }

    public function refundAda(AdminAdaRefundRequest $request, int $courseHistoryId): \Illuminate\Http\JsonResponse
    {
        $history = CourseHistory::with('user.userWallet')->findOrFail($courseHistoryId);
        $result = $this->coursePurchaseService->refundPurchaseTransaction($history, (bool) $request->input('force', false));
        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
