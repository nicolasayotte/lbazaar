<?php

namespace App\Services\API;

use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletTransactionHistory;
use App\Repositories\UserRepository;
use App\Traits\Web3CommandTrait;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CoursePurchaseService
{
    use Web3CommandTrait;

    protected $walletService;
    protected $userRepository;
    protected RewardInvalidationService $rewardInvalidationService;
    protected ExchangeRateService $exchangeRateService;

    public function __construct(
        WalletService $walletService,
        UserRepository $userRepository,
        RewardInvalidationService $rewardInvalidationService,
        ExchangeRateService $exchangeRateService
    ) {
        $this->walletService = $walletService;
        $this->userRepository = $userRepository;
        $this->rewardInvalidationService = $rewardInvalidationService;
        $this->exchangeRateService = $exchangeRateService;
    }

    /**
     * Build unsigned purchase transaction
     */
    public function buildPurchaseTransaction(CourseSchedule $schedule, User $user): array
    {
        $userWallet = $user->userWallet()->first();
        if (!$userWallet || !$userWallet->stake_key_hash) {
            return [
                'success' => false,
                'message' => 'User wallet not connected. Please connect your wallet first.'
            ];
        }

        $professor = $schedule->course->professor;
        $teacherWalletAddr = $this->resolvePaymentAddress($professor);

        if (!$teacherWalletAddr) {
            Log::warning('Purchase aborted: cannot resolve teacher wallet address', [
                'professor_id' => $professor?->id,
            ]);
            return [
                'success' => false,
                'message' => 'Teacher wallet address could not be resolved. Please contact support.'
            ];
        }

        // Admin commission goes to the platform owner wallet (configured in .env)
        $adminWalletAddr = config('services.cardano.owner_wallet_addr');
        if (empty($adminWalletAddr)) {
            Log::error('Purchase aborted: OWNER_WALLET_ADDR not configured');
            return [
                'success' => false,
                'message' => 'Platform wallet not configured. Please contact support.'
            ];
        }

        $adaTotalAmount = $this->convertJpyToAda((float) $schedule->course->getRawOriginal('price'));
        $adminCommissionSetting = Setting::where('slug', 'admin-commission')->first();
        $adminCommissionPercent = $adminCommissionSetting ? floatval($adminCommissionSetting->value) : 20;

        $cborUtxos = request()->input('cborUtxos', '');

        $cmd = $this->buildWeb3Command('run/build-purchase-tx.mjs', [
            $userWallet->stake_key_hash,
            $userWallet->address,
            $cborUtxos,
            (string) $adaTotalAmount,
            $teacherWalletAddr,
            $adminWalletAddr,
            (string) $adminCommissionPercent
        ]);

        try {
            $response = $this->runCommand($cmd);
        } catch (Exception $e) {
            Log::error('Build purchase transaction: web3 command failed', [
                'schedule_id' => $schedule->id,
                'user_id'     => $user->id,
                'error'       => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'message' => 'Failed to build purchase transaction: ' . $e->getMessage()
            ];
        }

        $responseJSON = json_decode($response, true);

        if (!is_array($responseJSON) || ($responseJSON['status'] ?? null) !== 200) {
            $errorMsg = $responseJSON['error'] ?? 'Failed to build transaction';
            $status = $responseJSON['status'] ?? 500;
            return [
                'success' => false,
                'message' => $errorMsg,
                'insufficientFunds' => $status === 501
            ];
        }

        $quoteExpiresAt = now()->addSeconds($this->quoteWindowSeconds())->toIso8601String();
        Cache::put(
            $this->quoteKey($user->id, $schedule->id),
            ['adaAmount' => $adaTotalAmount, 'expiresAt' => $quoteExpiresAt],
            $this->quoteWindowSeconds()
        );

        return [
            'success' => true,
            'message' => 'Transaction built successfully',
            'data' => [
                'cborTx'          => $responseJSON['cborTx'],
                'adaAmount'       => $adaTotalAmount,
                'teacherAmount'   => $responseJSON['teacherAmount'] ?? null,
                'adminAmount'     => $responseJSON['adminAmount'] ?? null,
                'quoteExpiresAt'  => $quoteExpiresAt,
            ]
        ];
    }

    /**
     * Submit signed purchase transaction
     */
    public function submitPurchaseTransaction(CourseSchedule $schedule, User $user, string $cborSig, string $cborTx): array
    {
        $professor = $schedule->course->professor;
        $teacherWalletAddr = $this->resolvePaymentAddress($professor);
        $adminWalletAddr = config('services.cardano.owner_wallet_addr');

        if (!$teacherWalletAddr || empty($adminWalletAddr)) {
            return [
                'success' => false,
                'message' => 'System wallets not configured. Please contact support.'
            ];
        }

        // Gap 1: Quote validation
        $quote = Cache::get($this->quoteKey($user->id, $schedule->id));
        if (!$quote) {
            return ['success' => false, 'message' => 'Price quote expired. Please re-initiate checkout.', 'quoteExpired' => true];
        }

        // Gap 2: Fast pre-check for duplicate
        $hasPending = CourseHistory::where('user_id', $user->id)
            ->where('course_schedule_id', $schedule->id)
            ->whereIn('payment_status', ['pending', 'confirmed'])
            ->exists();
        if ($hasPending) {
            return ['success' => false, 'message' => 'A payment is already pending or confirmed for this class.', 'duplicate' => true];
        }

        $cmd = $this->buildWeb3Command('run/submit-purchase-tx.mjs', [
            $cborSig,
            $cborTx,
            $teacherWalletAddr,
            $adminWalletAddr
        ]);

        try {
            $response = $this->runCommand($cmd);
        } catch (Exception $e) {
            Log::error('Submit purchase transaction: web3 command failed', [
                'schedule_id' => $schedule->id,
                'user_id'     => $user->id,
                'error'       => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'message' => 'Failed to submit purchase transaction: ' . $e->getMessage()
            ];
        }

        $responseJSON = json_decode($response, true);

        if (!is_array($responseJSON) || ($responseJSON['status'] ?? null) !== 200) {
            return [
                'success' => false,
                'message' => $responseJSON['error'] ?? 'Failed to submit transaction'
            ];
        }

        $txId = $responseJSON['txId'];
        $adaAmount = $responseJSON['teacherAmount'] ?? 0;

        try {
            $courseHistory = DB::transaction(function () use ($schedule, $user, $txId, $adaAmount) {
                $existing = CourseHistory::where('user_id', $user->id)
                    ->where('course_schedule_id', $schedule->id)
                    ->whereIn('payment_status', ['pending', 'confirmed'])
                    ->lockForUpdate()
                    ->first();
                if ($existing) {
                    throw new \RuntimeException('Duplicate payment detected under lock.');
                }

                $courseHistory = CourseHistory::create([
                    'course_schedule_id'              => $schedule->id,
                    'course_id'                       => $schedule->course->id,
                    'user_id'                         => $user->id,
                    'payment_status'                  => 'pending',
                    'payment_tx_hash'                 => $txId,
                    'payment_ada_amount'              => $adaAmount,
                    'payment_submitted_at'            => now(),
                    'enrolled_certificate_enabled'      => (bool) $schedule->course->certificate_enabled,
                    'enrolled_certificate_name'         => $schedule->course->certificate_name,
                    'enrolled_certificate_description'  => $schedule->course->certificate_description,
                    'enrolled_certificate_image_url'    => $schedule->course->certificate_image_url,
                    'enrolled_token_reward_enabled'     => (bool) $schedule->course->token_reward_enabled,
                    'enrolled_token_reward_amount'    => $schedule->course->token_reward_amount,
                ]);

                $userWallet = $user->userWallet()->first();
                if ($userWallet) {
                    $this->walletService->updateWalletTransaction(
                        $userWallet,
                        WalletTransactionHistory::PURCHASE,
                        0,
                        0,
                        $txId,
                        'pending',
                        $courseHistory->id
                    );
                }

                return $courseHistory;
            });
        } catch (Exception $e) {
            if ($e instanceof \RuntimeException && str_contains($e->getMessage(), 'Duplicate payment')) {
                return ['success' => false, 'message' => 'A payment is already pending or confirmed for this class.', 'duplicate' => true];
            }
            Log::error('Submit purchase transaction: failed to record in DB', [
                'schedule_id' => $schedule->id,
                'user_id'     => $user->id,
                'tx_id'       => $txId,
                'error'       => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'message' => 'Transaction submitted to blockchain but failed to record locally. Contact support with tx: ' . $txId
            ];
        }

        Cache::forget($this->quoteKey($user->id, $schedule->id));

        return [
            'success' => true,
            'message' => 'Transaction submitted successfully. Waiting for blockchain confirmation.',
            'data' => [
                'txId'            => $txId,
                'adaAmount'       => $adaAmount,
                'courseHistoryId' => $courseHistory->id
            ]
        ];
    }

    /**
     * Confirm purchase transaction (called by webhook)
     */
    public function confirmPurchaseTransaction(string $txId): array
    {
        try {
            return DB::transaction(function () use ($txId) {
                $courseHistory = CourseHistory::where('payment_tx_hash', $txId)
                    ->where('payment_status', 'pending')
                    ->lockForUpdate()
                    ->first();

                if (!$courseHistory) {
                    return [
                        'success' => false,
                        'message' => 'Course history not found or already confirmed'
                    ];
                }

                $courseHistory->update([
                    'payment_status' => 'confirmed',
                    'payment_confirmed_at' => now()
                ]);

                $walletTrans = WalletTransactionHistory::where('tx_id', $txId)->first();
                if ($walletTrans) {
                    $walletTrans->status = 'confirmed';
                    $walletTrans->save();
                }

                Log::info('Purchase confirmed', [
                    'tx_id' => $txId,
                    'course_history_id' => $courseHistory->id
                ]);

                return [
                    'success' => true,
                    'message' => 'Purchase confirmed successfully'
                ];
            });

        } catch (Exception $e) {
            Log::error('Confirm purchase transaction failed', [
                'tx_id' => $txId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to confirm purchase: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Query the blockchain for the on-chain status of a transaction.
     *
     * Never throws. Returns a structured status array:
     *   ['status' => 'pending'|'confirmed'|'not_found'|'error', 'confirmations' => int, 'required' => int, 'message' => string]
     */
    public function getTxStatus(string $txId): array
    {
        $required = (int) config('services.cardano.required_confirmations', 10);
        try {
            $command = $this->buildWeb3Command('run/check-tx-confirmations.mjs', [$txId]);
            $output = $this->runCommand($command);
            $result = json_decode($output, true);

            if (($result['status'] ?? 0) === 404) {
                return ['status' => 'not_found'];
            }
            if (($result['status'] ?? 0) !== 200) {
                return ['status' => 'error', 'message' => $result['error'] ?? 'Failed to get tx status'];
            }
            $confirmations = (int) $result['confirmations'];
            if ($confirmations >= $required) {
                return ['status' => 'confirmed', 'confirmations' => $confirmations, 'required' => $required];
            }
            return ['status' => 'pending', 'confirmations' => $confirmations, 'required' => $required];
        } catch (\Exception $e) {
            Log::warning('getTxStatus: error', ['tx_id' => $txId, 'error' => $e->getMessage()]);
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Query the blockchain for the number of confirmations a transaction has.
     *
     * @throws \Exception if the script returns an error
     */
    public function getTxConfirmations(string $txId): int
    {
        $command = $this->buildWeb3Command('run/check-tx-confirmations.mjs', [$txId]);
        $output = $this->runCommand($command);
        $result = json_decode($output, true);

        if (($result['status'] ?? 0) !== 200) {
            throw new Exception($result['error'] ?? 'Failed to get tx confirmations');
        }

        return (int) $result['confirmations'];
    }

    /**
     * Mark a pending purchase as failed and update the associated wallet transaction.
     * Idempotent: returns success=false if already failed or not found.
     */
    public function failPurchaseTransaction(string $txId): array
    {
        return DB::transaction(function () use ($txId) {
            $history = CourseHistory::where('payment_tx_hash', $txId)
                ->where('payment_status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$history) {
                return [
                    'success' => false,
                    'message' => 'Course history not found or not in pending state'
                ];
            }

            $history->update(['payment_status' => 'failed']);

            // Update matching wallet transaction history
            WalletTransactionHistory::where('tx_id', $txId)
                ->where('status', 'pending')
                ->update(['status' => 'failed']);

            return [
                'success' => true,
                'message' => 'Purchase marked as failed'
            ];
        });
    }

    /**
     * Convert JPY to ADA using the unified exchange-rate source (CoinGecko live,
     * cached, with Setting('ada-to-jpy') as fallback). Rounds to 6 decimals so
     * the result has lovelace precision for on-chain transaction building.
     *
     * Throws when no rate is available from any source.
     */
    public function convertJpyToAda(float $jpyAmount): float
    {
        $rate = $this->exchangeRateService->getAdaJpyRate();

        if ($rate <= 0) {
            throw new Exception('ADA to JPY conversion rate not configured');
        }

        return round($jpyAmount / $rate, 6);
    }

    /**
     * Refund an ADA payment for a confirmed course purchase.
     *
     * Builds, signs and submits a refund transaction from the platform wallet
     * back to the student's registered wallet address.
     *
     * @param bool $force  When true, bypasses the rewards guard and sets
     *                     rewards_invalidated_at on the CourseHistory record.
     * @return array{success: bool, message: string, hasRewards?: bool, data?: array{txId: string, adaAmount: string}}
     *   On success: data contains txId and adaAmount.
     *   On rewards block: hasRewards=true is returned so callers can prompt for force confirmation.
     */
    public function refundPurchaseTransaction(CourseHistory $history, bool $force = false): array
    {
        if ($history->payment_status !== 'confirmed') {
            return ['success' => false, 'message' => 'Only confirmed ADA payments can be refunded.'];
        }
        if (!$history->payment_tx_hash || !$history->payment_ada_amount) {
            return ['success' => false, 'message' => 'Missing ADA transaction data.'];
        }

        if ($this->hasEarnedRewards($history) && !$force) {
            return ['success' => false, 'hasRewards' => true, 'message' => 'Student has earned rewards. Use force=true to proceed.'];
        }

        $studentWallet = $history->user->userWallet()->first();
        if (!$studentWallet || !$studentWallet->address) {
            return ['success' => false, 'message' => 'Student wallet address not found.'];
        }

        $adaAmount = (string) $history->payment_ada_amount;
        $cmd = $this->buildWeb3Command('run/build-refund-tx.mjs', [$studentWallet->address, $adaAmount]);

        try {
            $response = $this->runCommand($cmd, 60);
        } catch (\Exception $e) {
            Log::error('ADA refund failed', ['id' => $history->id, 'error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Failed to build refund transaction: ' . $e->getMessage()];
        }

        $result = json_decode($response, true);
        if (!is_array($result) || ($result['status'] ?? 0) !== 200) {
            return ['success' => false, 'message' => $result['error'] ?? 'Refund transaction failed'];
        }

        $txId = $result['txId'];

        try {
            DB::transaction(function () use ($history, $force) {
                $locked = CourseHistory::where('id', $history->id)->lockForUpdate()->first();
                if ($locked->payment_status === 'refunded') {
                    throw new \RuntimeException('Already refunded.');
                }
                $updates = ['payment_status' => 'refunded', 'is_cancelled' => true];
                $locked->update($updates);
                if ($force) {
                    $this->rewardInvalidationService->invalidateRewards($locked);
                }
            });
        } catch (\RuntimeException $e) {
            if (str_contains($e->getMessage(), 'Already refunded')) {
                Log::error('ADA refund: double-submit race — orphaned on-chain tx', [
                    'id' => $history->id, 'txId' => $txId,
                ]);
                return ['success' => false, 'message' => 'This payment has already been refunded.'];
            }
            throw $e;
        }

        Log::info('ADA payment refunded', ['id' => $history->id, 'txId' => $txId, 'amount' => $adaAmount]);

        // F-13: unconditional notifications to student and admin after refund completes
        $this->dispatchRefundNotifications($history, 'ADA');

        return ['success' => true, 'message' => 'ADA refund submitted.', 'data' => ['txId' => $txId, 'adaAmount' => $adaAmount]];
    }

    /**
     * Check whether a student has earned rewards (NFT certificate or token) for a course.
     */
    private function hasEarnedRewards(CourseHistory $history): bool
    {
        return \App\Models\NftTransactions::where('user_id', $history->user_id)
            ->where('course_id', $history->course_id)
            ->exists();
    }

    private function quoteKey(int $userId, int $scheduleId): string
    {
        return "purchase_quote_{$userId}_{$scheduleId}";
    }

    private function quoteWindowSeconds(): int
    {
        return (int) config('services.cardano.quote_window_minutes', 5) * 60;
    }

    /**
     * Validate that an address looks like a valid Cardano bech32 address.
     */
    private function isValidBech32Address(?string $address): bool
    {
        if (empty($address)) {
            return false;
        }

        // Enterprise addresses are ~63 chars, base addresses ~103 chars
        return (bool) preg_match('/^addr(_test)?1[0-9a-zA-Z]{50,}$/', $address);
    }

    /**
     * Resolve a payment (receiving) address for a user.
     * Recipients always use custodial addresses derived from their user ID.
     * Priority: cached custodial_address → derive from user ID.
     */
    private function resolvePaymentAddress(?User $user): ?string
    {
        if (!$user) {
            return null;
        }

        // 1. Pre-existing custodial address
        if ($this->isValidBech32Address($user->custodial_address)) {
            return $user->custodial_address;
        }

        // 2. Derive custodial address from user ID
        try {
            $cmd = $this->buildWeb3Command('common/get-custodial-address.mjs', [(string) $user->id]);
            $response = $this->runCommand($cmd);
            $json = json_decode($response, true);

            if (is_array($json) && ($json['status'] ?? 0) === 200 && !empty($json['address'])) {
                // Cache it on the user record for next time
                $user->update(['custodial_address' => $json['address']]);
                return $json['address'];
            }
        } catch (\Exception $e) {
            Log::warning('Failed to derive custodial address for payment', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
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
            Log::warning('CoursePurchaseService: failed to notify student of refund', [
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
            Log::warning('CoursePurchaseService: failed to notify admin of refund', [
                'course_history_id' => $history->id,
                'error'             => $e->getMessage(),
            ]);
        }
    }

}
