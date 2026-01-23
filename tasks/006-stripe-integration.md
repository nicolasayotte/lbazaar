# Task 006: Stripe Credit Card Integration (Japan-Compliant)

## Overview

Implement full Stripe integration for JPY credit card payments, **replacing the NMKR Pay backend** implemented in Milestone 3. NMKR Pay was initially explored but Stripe provides better Japan compliance for credit card payments.

This allows students to purchase courses using credit cards as an alternative to ADA payments. The implementation must be Japan-compliant, supporting JCB cards and proper tax handling.

## Background

Milestone 3 implemented NMKR Pay backend functions for credit card payments. However, due to Japan regulatory requirements, the decision was made to replace NMKR Pay with Stripe for Milestone 4. The NMKR Pay code should be deprecated/removed as part of this task.

## Acceptance Criteria

- [ ] Students can choose "Pay with Credit Card" on course purchase
- [ ] Stripe checkout form accepts card details securely
- [ ] Payments processed in Japanese Yen (JPY)
- [ ] JCB cards accepted (in addition to Visa/Mastercard/Amex)
- [ ] Payment confirmation creates course enrollment
- [ ] Webhook handles async payment confirmation
- [ ] Failed payments show appropriate error messages
- [ ] Refunds processed when course is cancelled
- [ ] Payment records stored for accounting
- [ ] Receipts generated with required fields

## Files to Create

### Backend

| File | Purpose |
|------|---------|
| `app/Services/API/StripeService.php` | Payment processing logic |
| `app/Http/Controllers/API/StripeController.php` | API endpoints and webhooks |
| `app/Http/Requests/StripeCheckoutRequest.php` | Request validation |
| `app/Models/StripePayment.php` | Payment record model |
| `database/migrations/xxxx_create_stripe_payments_table.php` | Payment records table |

### Frontend

| File | Purpose |
|------|---------|
| `resources/js/components/payments/StripeCheckout.jsx` | Stripe Elements payment form |
| `resources/js/pages/Portal/Checkout/Index.jsx` | Checkout page |
| `resources/js/pages/Portal/Checkout/Success.jsx` | Payment success page |
| `resources/js/pages/Portal/Checkout/Cancel.jsx` | Payment cancelled page |

### Configuration

| File | Purpose |
|------|---------|
| `config/services.php` | Add Stripe configuration |
| `.env.example` | Document Stripe env vars |

## Context Files (Read These First)

```
app/Http/Controllers/Portal/CourseController.php    # Current course booking flow
resources/js/pages/Portal/Course/Details.jsx        # Course purchase UI
app/Models/CourseHistory.php                        # Enrollment records
composer.json                                        # Current dependencies
package.json                                         # Frontend dependencies
```

## NMKR Pay Files to Deprecate/Remove

Search the codebase for NMKR Pay related code and deprecate:

```
app/Services/API/NmkrService.php                    # If exists - NMKR Pay service
app/Http/Controllers/API/NmkrController.php         # If exists - NMKR webhooks
web3/run/*nmkr*                                     # NMKR-related web3 scripts
config/services.php                                  # Remove NMKR config section
.env.example                                         # Remove NMKR env vars
```

**Note:** Review NMKR Pay implementation first to understand the payment flow, then implement equivalent functionality with Stripe.

## Implementation Notes

### 1. Install Dependencies

```bash
# Backend
sail composer require stripe/stripe-php

# Frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Database Migration

```php
// database/migrations/xxxx_create_stripe_payments_table.php
Schema::create('stripe_payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->foreignId('course_id')->constrained();
    $table->foreignId('course_history_id')->nullable()->constrained();
    $table->string('stripe_payment_intent_id')->unique();
    $table->string('stripe_customer_id')->nullable();
    $table->integer('amount'); // In JPY (smallest unit = 1 yen)
    $table->string('currency', 3)->default('jpy');
    $table->enum('status', ['pending', 'succeeded', 'failed', 'refunded'])->default('pending');
    $table->string('receipt_url')->nullable();
    $table->json('metadata')->nullable();
    $table->timestamps();

    $table->index('stripe_payment_intent_id');
    $table->index(['user_id', 'status']);
});
```

### 3. Stripe Service

```php
// app/Services/API/StripeService.php
<?php

namespace App\Services\API;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Webhook;
use App\Models\Course;
use App\Models\StripePayment;
use App\Models\CourseHistory;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function createPaymentIntent(Course $course, $userId): array
    {
        $amount = (int) $course->price; // JPY is zero-decimal currency

        $paymentIntent = PaymentIntent::create([
            'amount' => $amount,
            'currency' => 'jpy',
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => [
                'course_id' => $course->id,
                'user_id' => $userId,
            ],
        ]);

        // Record pending payment
        StripePayment::create([
            'user_id' => $userId,
            'course_id' => $course->id,
            'stripe_payment_intent_id' => $paymentIntent->id,
            'amount' => $amount,
            'status' => 'pending',
        ]);

        return [
            'clientSecret' => $paymentIntent->client_secret,
            'paymentIntentId' => $paymentIntent->id,
        ];
    }

    public function handleWebhook(string $payload, string $signature): void
    {
        $event = Webhook::constructEvent(
            $payload,
            $signature,
            config('services.stripe.webhook_secret')
        );

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentSuccess($event->data->object);
                break;
            case 'payment_intent.payment_failed':
                $this->handlePaymentFailure($event->data->object);
                break;
        }
    }

    protected function handlePaymentSuccess($paymentIntent): void
    {
        $payment = StripePayment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if (!$payment) return;

        $payment->update([
            'status' => 'succeeded',
            'receipt_url' => $paymentIntent->charges->data[0]->receipt_url ?? null,
        ]);

        // Create course enrollment
        $courseHistory = CourseHistory::create([
            'user_id' => $payment->user_id,
            'course_id' => $payment->course_id,
            'payment_method' => 'stripe',
            'payment_status' => 'paid',
        ]);

        $payment->update(['course_history_id' => $courseHistory->id]);

        // Send confirmation email
        // Mail::to($payment->user)->send(new CourseEnrollmentConfirmation($courseHistory));
    }

    protected function handlePaymentFailure($paymentIntent): void
    {
        StripePayment::where('stripe_payment_intent_id', $paymentIntent->id)
            ->update(['status' => 'failed']);
    }

    public function refund(StripePayment $payment): void
    {
        \Stripe\Refund::create([
            'payment_intent' => $payment->stripe_payment_intent_id,
        ]);

        $payment->update(['status' => 'refunded']);
    }
}
```

### 4. Stripe Controller

```php
// app/Http/Controllers/API/StripeController.php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\API\StripeService;
use App\Models\Course;
use Illuminate\Http\Request;

class StripeController extends Controller
{
    public function __construct(private StripeService $stripeService) {}

    public function createPaymentIntent(Request $request, Course $course)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        $result = $this->stripeService->createPaymentIntent(
            $course,
            auth()->id()
        );

        return response()->json($result);
    }

    public function webhook(Request $request)
    {
        $this->stripeService->handleWebhook(
            $request->getContent(),
            $request->header('Stripe-Signature')
        );

        return response()->json(['status' => 'success']);
    }
}
```

### 5. Frontend Checkout Component

```jsx
// resources/js/components/payments/StripeCheckout.jsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ courseId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?course_id=${courseId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message);
      setLoading(false);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || loading}
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
};

export const StripeCheckout = ({ clientSecret, courseId, onSuccess, onError }) => {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#1976d2',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm courseId={courseId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};
```

### 6. Course Details Integration

```jsx
// In resources/js/pages/Portal/Course/Details.jsx
// Add alongside "Buy with ADA" button

const [showStripeCheckout, setShowStripeCheckout] = useState(false);
const [clientSecret, setClientSecret] = useState(null);

const handlePayWithCard = async () => {
  try {
    const { data } = await axios.post(`/api/stripe/payment-intent`, {
      course_id: course.id,
    });
    setClientSecret(data.clientSecret);
    setShowStripeCheckout(true);
  } catch (error) {
    showError('Failed to initialize payment');
  }
};

// In render:
<Button
  variant="outlined"
  onClick={handlePayWithCard}
  startIcon={<CreditCardIcon />}
>
  Pay with Credit Card (¥{course.price.toLocaleString()})
</Button>

{showStripeCheckout && clientSecret && (
  <Dialog open={showStripeCheckout} onClose={() => setShowStripeCheckout(false)}>
    <DialogTitle>Complete Payment</DialogTitle>
    <DialogContent>
      <StripeCheckout
        clientSecret={clientSecret}
        courseId={course.id}
        onSuccess={() => router.visit(`/checkout/success?course_id=${course.id}`)}
        onError={(msg) => showError(msg)}
      />
    </DialogContent>
  </Dialog>
)}
```

### 7. Configuration

```php
// config/services.php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],
```

```env
# .env.example
STRIPE_KEY=pk_test_xxx
STRIPE_SECRET=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_STRIPE_PUBLIC_KEY="${STRIPE_KEY}"
```

### 8. Routes

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/stripe/payment-intent/{course}', [StripeController::class, 'createPaymentIntent']);
});

Route::post('/stripe/webhook', [StripeController::class, 'webhook'])
    ->withoutMiddleware(['csrf', 'auth']);
```

## Japan Compliance Notes

1. **JCB Support**: Enabled by default in Stripe Japan accounts
2. **Currency**: JPY is a zero-decimal currency (¥1000 = amount: 1000)
3. **Tax**: Consider adding consumption tax display (10%)
4. **Receipts**: Stripe provides receipt URLs automatically
5. **Specified Commercial Transactions Act**: May need additional disclosures on checkout page

## Expected Tests

### Unit Tests (PHPUnit)

```php
// tests/Unit/Services/StripeServiceTest.php
- test_creates_payment_intent_with_correct_amount()
- test_payment_intent_includes_metadata()
- test_handles_successful_payment_webhook()
- test_handles_failed_payment_webhook()
- test_creates_enrollment_on_success()
- test_processes_refund()

// tests/Feature/StripeCheckoutTest.php
- test_authenticated_user_can_create_payment_intent()
- test_unauthenticated_user_cannot_create_payment_intent()
- test_webhook_updates_payment_status()
- test_webhook_rejects_invalid_signature()
```

### Frontend Tests

```javascript
// StripeCheckout.test.jsx
- renders payment element
- handles successful payment
- handles payment error
- shows loading state during processing
```

### Manual Testing Checklist

- [ ] Navigate to course details
- [ ] Click "Pay with Credit Card"
- [ ] Verify Stripe checkout form appears
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Complete payment
- [ ] Verify redirected to success page
- [ ] Verify course enrollment created
- [ ] Check StripePayment record in database
- [ ] Test with JCB test card: 3566 0020 2036 0505
- [ ] Test declined card: 4000 0000 0000 0002
- [ ] Verify error message displayed

### Stripe Test Cards

| Card | Number |
|------|--------|
| Success | 4242 4242 4242 4242 |
| JCB | 3566 0020 2036 0505 |
| Decline | 4000 0000 0000 0002 |
| Auth Required | 4000 0025 0000 3155 |

## Dependencies

- **Task 002** (JPY Pricing) - Course prices must be in JPY

## Stripe Dashboard Setup

1. Create Stripe account (or use test mode)
2. Enable JCB in payment methods (should be default for Japan)
3. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook signing secret to `.env`

## Estimated Scope

- Backend: ~5 new files
- Frontend: ~4 new files
- Database: 1 migration
- Config: 2 files
- Tests: ~3 test files
