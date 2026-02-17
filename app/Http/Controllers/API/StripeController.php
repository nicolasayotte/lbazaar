<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StripeCheckoutRequest;
use App\Models\Course;
use App\Services\API\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StripeController extends Controller
{
    protected StripeService $stripeService;

    public function __construct(StripeService $stripeService)
    {
        $this->stripeService = $stripeService;
    }

    /**
     * Create Stripe PaymentIntent for course purchase
     * POST /api/stripe/payment-intent/{course}
     */
    public function createPaymentIntent(StripeCheckoutRequest $request, Course $course)
    {
        $result = $this->stripeService->createPaymentIntent(
            $course,
            Auth::id(),
            $request->input('course_schedule_id')
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Handle Stripe webhook events
     * POST /api/stripe/webhook
     */
    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        if (!$signature) {
            return response()->json([
                'success' => false,
                'message' => 'Missing Stripe-Signature header',
            ], 400);
        }

        $result = $this->stripeService->handleWebhook($payload, $signature);

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
