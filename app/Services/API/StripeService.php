<?php

namespace App\Services\API;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\StripePayment;
use App\Repositories\UserRepository;
use App\Services\API\RewardInvalidationService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Refund;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Exception\IdempotencyException;

class StripeService
{
    public function __construct(
        private RewardInvalidationService $rewardInvalidationService,
        private UserRepository $userRepository,
    ) {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function isAvailable(): bool
    {
        return !empty(config('services.stripe.secret'));
    }

    /**
     * Generate idempotency key for Stripe API calls
     * Uses a hash of user_id + course_id + 5-minute time window
     *
     * @param int $userId
     * @param int $courseId
     * @return string
     */
    protected function generateIdempotencyKey(int $userId, int $courseId): string
    {
        // Use 5-minute time window (300 seconds) to allow retries within same window
        $timeWindow = floor(time() / 300);

        // Create deterministic hash from user_id, course_id, and time window
        return hash('sha256', "{$userId}:{$courseId}:{$timeWindow}");
    }

    /**
     * Create a Stripe PaymentIntent for course purchase
     *
     * @param Course $course
     * @param int $userId
     * @param int|null $courseScheduleId
     * @return array
     */
    public function createPaymentIntent(Course $course, int $userId, ?int $courseScheduleId = null): array
    {
        try {
            // Read raw DB value — $course->price goes through a number_format accessor
            // that returns "1,000.00", making (int) truncate to 1.
            $amount = (int) $course->getRawOriginal('price');

            // Reject if amount is invalid
            if ($amount <= 0) {
                return [
                    'success' => false,
                    'message' => 'Invalid payment amount. Amount must be greater than zero.'
                ];
            }

            // Block Stripe payment if a pending ADA payment exists for this course
            $pendingAda = \App\Models\CourseHistory::where('user_id', $userId)
                ->where('course_id', $course->id)
                ->where('payment_status', 'pending')
                ->exists();

            if ($pendingAda) {
                return [
                    'success' => false,
                    'message' => 'A pending ADA payment exists for this course. Please wait for it to confirm or fail before using a different payment method.'
                ];
            }

            // Generate idempotency key for duplicate request prevention
            $idempotencyKey = $this->generateIdempotencyKey($userId, $course->id);

            // Create Stripe PaymentIntent with idempotency key
            $paymentIntent = PaymentIntent::create([
                'amount' => $amount,
                'currency' => 'jpy',
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
                'metadata' => [
                    'user_id' => $userId,
                    'course_id' => $course->id,
                    'course_schedule_id' => $courseScheduleId ?? '',
                    'course_title' => $course->title,
                ],
            ], [
                'idempotency_key' => $idempotencyKey,
            ]);

            // Create StripePayment record
            $payment = StripePayment::create([
                'user_id' => $userId,
                'course_id' => $course->id,
                'stripe_payment_intent_id' => $paymentIntent->id,
                'stripe_customer_id' => $paymentIntent->customer,
                'amount' => $amount,
                'currency' => 'jpy',
                'status' => 'pending',
                'metadata' => [
                    'course_schedule_id' => $courseScheduleId,
                    'course_title' => $course->title,
                ],
            ]);

            Log::info('Payment intent created', [
                'payment_intent_id' => $paymentIntent->id,
                'user_id' => $userId,
                'course_id' => $course->id,
                'amount' => $amount,
            ]);

            return [
                'success' => true,
                'message' => 'Payment intent created successfully',
                'data' => [
                    'client_secret' => $paymentIntent->client_secret,
                    'payment_intent_id' => $paymentIntent->id,
                    'amount' => $amount,
                    'currency' => 'jpy',
                ]
            ];

        } catch (IdempotencyException $e) {
            // Idempotency key already used for a different request
            Log::warning('Idempotency key conflict', [
                'course_id' => $course->id,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Duplicate payment request detected. Please try again in a few minutes.'
            ];

        } catch (Exception $e) {
            Log::error('Create payment intent failed', [
                'course_id' => $course->id,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to create payment intent: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Handle Stripe webhook events
     *
     * @param string $payload
     * @param string $signature
     * @return array
     */
    public function handleWebhook(string $payload, string $signature): array
    {
        try {
            // Verify webhook signature
            $event = Webhook::constructEvent(
                $payload,
                $signature,
                config('services.stripe.webhook_secret')
            );

            Log::info('Stripe webhook received', [
                'event_type' => $event->type,
                'event_id' => $event->id,
            ]);

            // Handle different event types
            switch ($event->type) {
                case 'payment_intent.succeeded':
                    return $this->handlePaymentSuccess($event->data->object);

                case 'payment_intent.payment_failed':
                    return $this->handlePaymentFailure($event->data->object);

                case 'payment_intent.canceled':
                    return $this->handlePaymentCanceled($event->data->object);

                case 'charge.dispute.created':
                    return $this->handleChargeback($event->data->object);

                default:
                    Log::info('Unhandled webhook event type', [
                        'event_type' => $event->type,
                    ]);
                    return [
                        'success' => true,
                        'message' => 'Webhook event received but not processed',
                    ];
            }

        } catch (SignatureVerificationException $e) {
            Log::error('Webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Webhook signature verification failed'
            ];

        } catch (Exception $e) {
            Log::error('Webhook handling failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Webhook handling failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Handle successful payment
     *
     * @param \Stripe\PaymentIntent $paymentIntent
     * @return array
     */
    protected function handlePaymentSuccess($paymentIntent): array
    {
        try {
            return DB::transaction(function () use ($paymentIntent) {
                // Find pending payment with row lock for idempotency
                $payment = StripePayment::where('stripe_payment_intent_id', $paymentIntent->id)
                    ->where('status', 'pending')
                    ->lockForUpdate()
                    ->first();

                // If not found, payment was already processed
                if (!$payment) {
                    Log::info('Payment already processed (idempotency)', [
                        'payment_intent_id' => $paymentIntent->id,
                    ]);

                    return [
                        'success' => true,
                        'message' => 'Payment already processed'
                    ];
                }

                // Get course_schedule_id from payment metadata
                $courseScheduleId = $payment->metadata['course_schedule_id'] ?? null;

                // Load course to snapshot reward config at enrollment time
                $course = $payment->course;

                // Create CourseHistory enrollment record
                $courseHistory = CourseHistory::create([
                    'user_id'                         => $payment->user_id,
                    'course_id'                       => $payment->course_id,
                    'course_schedule_id'              => $courseScheduleId,
                    'is_cancelled'                    => false,
                    'enrolled_certificate_enabled'    => $course ? (bool) $course->certificate_enabled : false,
                    'enrolled_certificate_name'       => $course ? $course->certificate_name : null,
                    'enrolled_certificate_description' => $course ? $course->certificate_description : null,
                    'enrolled_token_reward_enabled'   => $course ? (bool) $course->token_reward_enabled : false,
                    'enrolled_token_reward_amount'    => $course ? $course->token_reward_amount : null,
                ]);

                // Get receipt URL from charges
                $receiptUrl = null;
                if (isset($paymentIntent->charges->data[0]->receipt_url)) {
                    $receiptUrl = $paymentIntent->charges->data[0]->receipt_url;
                }

                // Update payment record
                $payment->update([
                    'status' => 'succeeded',
                    'course_history_id' => $courseHistory->id,
                    'receipt_url' => $receiptUrl,
                ]);

                Log::info('Payment succeeded', [
                    'payment_intent_id' => $paymentIntent->id,
                    'payment_id' => $payment->id,
                    'course_history_id' => $courseHistory->id,
                    'user_id' => $payment->user_id,
                    'course_id' => $payment->course_id,
                ]);

                return [
                    'success' => true,
                    'message' => 'Payment processed successfully',
                    'data' => [
                        'payment_id' => $payment->id,
                        'course_history_id' => $courseHistory->id,
                    ]
                ];
            });

        } catch (Exception $e) {
            Log::error('Handle payment success failed', [
                'payment_intent_id' => $paymentIntent->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process payment success: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Handle failed payment
     *
     * @param \Stripe\PaymentIntent $paymentIntent
     * @return array
     */
    protected function handlePaymentFailure($paymentIntent): array
    {
        try {
            $payment = StripePayment::where('stripe_payment_intent_id', $paymentIntent->id)
                ->first();

            if (!$payment) {
                Log::warning('Payment record not found for failed payment', [
                    'payment_intent_id' => $paymentIntent->id,
                ]);

                return [
                    'success' => false,
                    'message' => 'Payment record not found'
                ];
            }

            // Get failure reason
            $failureReason = 'Unknown';
            if (isset($paymentIntent->last_payment_error->message)) {
                $failureReason = $paymentIntent->last_payment_error->message;
            }

            // Update payment status
            $payment->update([
                'status' => 'failed',
                'metadata' => array_merge($payment->metadata ?? [], [
                    'failure_reason' => $failureReason,
                ]),
            ]);

            Log::warning('Payment failed', [
                'payment_intent_id' => $paymentIntent->id,
                'payment_id' => $payment->id,
                'user_id' => $payment->user_id,
                'course_id' => $payment->course_id,
                'failure_reason' => $failureReason,
            ]);

            return [
                'success' => true,
                'message' => 'Payment failure recorded',
                'data' => [
                    'payment_id' => $payment->id,
                    'failure_reason' => $failureReason,
                ]
            ];

        } catch (Exception $e) {
            Log::error('Handle payment failure failed', [
                'payment_intent_id' => $paymentIntent->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process payment failure: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Handle canceled payment
     *
     * @param \Stripe\PaymentIntent $paymentIntent
     * @return array
     */
    protected function handlePaymentCanceled($paymentIntent): array
    {
        try {
            $payment = StripePayment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

            if (!$payment) {
                Log::warning('Payment record not found for canceled payment', [
                    'payment_intent_id' => $paymentIntent->id,
                ]);
                return ['success' => false, 'message' => 'Payment record not found'];
            }

            // Only update if still pending (idempotency)
            if ($payment->status === 'pending') {
                $cancellationReason = $paymentIntent->cancellation_reason ?? 'User canceled';

                $payment->update([
                    'status' => 'canceled',
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'cancellation_reason' => $cancellationReason,
                        'canceled_at' => now()->toISOString(),
                    ]),
                ]);

                Log::info('Payment canceled', [
                    'payment_intent_id' => $paymentIntent->id,
                    'payment_id' => $payment->id,
                    'user_id' => $payment->user_id,
                    'course_id' => $payment->course_id,
                ]);
            }

            return [
                'success' => true,
                'message' => 'Payment cancellation recorded',
                'data' => ['payment_id' => $payment->id, 'status' => $payment->status]
            ];
        } catch (Exception $e) {
            Log::error('Handle payment cancellation failed', [
                'payment_intent_id' => $paymentIntent->id,
                'error' => $e->getMessage(),
            ]);
            return ['success' => false, 'message' => 'Failed to process payment cancellation: ' . $e->getMessage()];
        }
    }

    /**
     * Refund a payment and cancel enrollment
     *
     * @param StripePayment $payment
     * @return array
     */
    public function refund(StripePayment $payment, array $options = []): array
    {
        try {
            // Only refund succeeded payments
            if ($payment->status !== 'succeeded') {
                return [
                    'success' => false,
                    'message' => 'Only succeeded payments can be refunded. Current status: ' . $payment->status
                ];
            }

            $courseHistory = $payment->course_history_id ? CourseHistory::find($payment->course_history_id) : null;
            if ($courseHistory) {
                $hasRewards = \App\Models\NftTransactions::where('user_id', $courseHistory->user_id)
                    ->where('course_id', $courseHistory->course_id)
                    ->exists();
                if ($hasRewards && !($options['force'] ?? false)) {
                    return ['success' => false, 'hasRewards' => true, 'message' => 'Student has earned rewards. Use force=true to proceed.'];
                }
            }

            // Use pass-by-reference to get refund ID out of transaction closure
            $refundId = null;

            // Execute Stripe refund and database update atomically
            DB::transaction(function () use ($payment, $options, &$refundId) {
                // Create Stripe refund INSIDE transaction for atomicity
                $refund = Refund::create([
                    'payment_intent' => $payment->stripe_payment_intent_id,
                ]);
                $refundId = $refund->id;

                // Update payment status
                $payment->update([
                    'status' => 'refunded',
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'refund_id' => $refund->id,
                        'refunded_at' => now()->toISOString(),
                    ]),
                ]);

                // Cancel enrollment if exists
                if ($payment->course_history_id) {
                    $ch = CourseHistory::where('id', $payment->course_history_id)->lockForUpdate()->first();
                    if ($ch) {
                        $updates = ['is_cancelled' => true];
                        $ch->update($updates);
                        if ($options['force'] ?? false) {
                            $this->rewardInvalidationService->invalidateRewards($ch);
                        }
                    }
                }
            });

            Log::info('Payment refunded', [
                'payment_intent_id' => $payment->stripe_payment_intent_id,
                'refund_id' => $refundId,
                'payment_id' => $payment->id,
                'user_id' => $payment->user_id,
                'course_id' => $payment->course_id,
                'course_history_id' => $payment->course_history_id,
            ]);

            // F-13: unconditional notifications to student and admin after refund completes
            if ($payment->course_history_id) {
                $ch = CourseHistory::find($payment->course_history_id);
                if ($ch) {
                    $this->dispatchRefundNotifications($ch, 'Stripe');
                }
            }

            return [
                'success' => true,
                'message' => 'Payment refunded successfully',
                'data' => [
                    'refund_id' => $refundId,
                    'payment_id' => $payment->id,
                ]
            ];

        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Handle Stripe-specific errors
            Log::error('Stripe refund request failed', [
                'payment_intent_id' => $payment->stripe_payment_intent_id,
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Stripe refund failed: ' . $e->getMessage()
            ];

        } catch (Exception $e) {
            Log::error('Refund failed', [
                'payment_intent_id' => $payment->stripe_payment_intent_id,
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Refund failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Handle Stripe chargeback (dispute) by recording it and revoking course access.
     *
     * @param mixed $dispute
     * @return array
     */
    private function handleChargeback($dispute): array
    {
        try {
            $paymentIntentId = $dispute->payment_intent ?? null;

            Log::warning('Stripe chargeback received', [
                'dispute_id' => $dispute->id,
                'payment_intent' => $paymentIntentId,
                'reason' => $dispute->reason ?? null,
            ]);

            if (!$paymentIntentId) {
                return ['success' => true, 'message' => 'Chargeback logged; no payment_intent for revocation'];
            }

            $payment = StripePayment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if (!$payment) {
                return ['success' => true, 'message' => 'Chargeback logged; payment not found'];
            }

            DB::transaction(function () use ($payment, $dispute) {
                $payment->update([
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'chargeback_dispute_id' => $dispute->id,
                        'chargeback_at' => now()->toISOString(),
                        'chargeback_reason' => $dispute->reason ?? null,
                    ]),
                ]);
                if ($payment->course_history_id) {
                    $ch = CourseHistory::where('id', $payment->course_history_id)
                        ->lockForUpdate()
                        ->first();
                    if ($ch) {
                        $ch->update(['is_cancelled' => true]);
                        $this->rewardInvalidationService->invalidateRewards($ch);
                    }
                }
            });

            return ['success' => true, 'message' => 'Chargeback recorded and access revoked'];
        } catch (\Exception $e) {
            Log::error('Chargeback handling failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Chargeback handling failed'];
        }
    }

    /**
     * F-13: Dispatch refund notifications to both student and admin.
     * Failures are caught and logged — never propagated.
     */
    private function dispatchRefundNotifications(CourseHistory $history, string $method): void
    {
        try {
            DB::table('notifications')->insert([
                'from_user_id' => null,
                'to_user_id'   => $history->user_id,
                'message'      => 'Your ' . $method . ' payment for course #' . $history->course_id . ' has been refunded and your enrollment has been cancelled.',
                'is_read'      => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('StripeService: failed to notify student of refund', [
                'course_history_id' => $history->id,
                'error'             => $e->getMessage(),
            ]);
        }

        try {
            $admin = $this->userRepository->getAdmin();
            if ($admin) {
                DB::table('notifications')->insert([
                    'from_user_id' => null,
                    'to_user_id'   => $admin->id,
                    'message'      => $method . ' refund processed for user #' . $history->user_id . ' on course #' . $history->course_id . ' (history #' . $history->id . '). Enrollment cancelled.',
                    'is_read'      => false,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('StripeService: failed to notify admin of refund', [
                'course_history_id' => $history->id,
                'error'             => $e->getMessage(),
            ]);
        }
    }
}
