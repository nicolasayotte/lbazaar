<?php

namespace App\Services\API;

use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletTransactionHistory;
use App\Repositories\UserRepository;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CoursePurchaseService
{
    protected $walletService;
    protected $userRepository;

    public function __construct(WalletService $walletService, UserRepository $userRepository)
    {
        $this->walletService = $walletService;
        $this->userRepository = $userRepository;
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
        $teacherWallet = $professor ? $professor->userWallet()->first() : null;
        $admin = $this->userRepository->getAdmin();
        $adminWallet = $admin ? $admin->userWallet()->first() : null;

        if (!$teacherWallet || !$adminWallet) {
            return [
                'success' => false,
                'message' => 'System wallets not configured. Please contact support.'
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
            $teacherWallet->address,
            $adminWallet->address,
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
        $teacherWallet = $professor ? $professor->userWallet()->first() : null;
        $admin = $this->userRepository->getAdmin();
        $adminWallet = $admin ? $admin->userWallet()->first() : null;

        if (!$teacherWallet || !$adminWallet) {
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
            $teacherWallet->address,
            $adminWallet->address
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
                    'course_schedule_id'   => $schedule->id,
                    'course_id'            => $schedule->course->id,
                    'user_id'              => $user->id,
                    'payment_status'       => 'pending',
                    'payment_tx_hash'      => $txId,
                    'payment_ada_amount'   => $adaAmount,
                    'payment_submitted_at' => now()
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
     * Convert JPY to ADA using exchange rate from settings
     */
    public function convertJpyToAda(float $jpyAmount): float
    {
        $adaToJpy = Setting::where('slug', 'ada-to-jpy')->first();

        if (!$adaToJpy) {
            throw new Exception('ADA to JPY conversion rate not configured');
        }

        $rate = floatval($adaToJpy->value);
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
                if ($force) {
                    $updates['rewards_invalidated_at'] = now();
                }
                $locked->update($updates);
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
     * Build web3 command with proper escaping
     * Following CertificateService pattern
     */
    protected function buildWeb3Command(string $scriptRelativePath, array $arguments = []): string
    {
        $web3Directory = base_path('web3');
        $scriptPath = './' . ltrim($scriptRelativePath, '/');
        $logPath = storage_path('logs/web3.log');

        $argumentString = '';
        if (!empty($arguments)) {
            $argumentString = ' ' . implode(' ', array_map('escapeshellarg', $arguments));
        }

        return sprintf(
            '(cd %s && node %s%s) 2>> %s',
            escapeshellarg($web3Directory),
            escapeshellarg($scriptPath),
            $argumentString,
            escapeshellarg($logPath)
        );
    }

    /**
     * Execute a shell command and return its output
     */
    protected function runCommand(string $command, int $timeout = 30): string
    {
        if (app()->environment('testing')) {
            throw new \RuntimeException(
                'runCommand() must be mocked in tests. Use shouldAllowMockingProtectedMethods() and shouldReceive(\'runCommand\'). Command: '
                . substr($command, 0, 100)
            );
        }

        $output = [];
        $returnVar = null;

        $timedCommand = sprintf('timeout %d %s', $timeout, $command);
        exec($timedCommand, $output, $returnVar);

        if ($returnVar === 124) {
            Log::error('Command execution timed out', [
                'command' => $command,
                'timeout' => $timeout,
            ]);
            throw new Exception("Command execution timed out after {$timeout} seconds");
        }

        return implode("\n", $output);
    }
}
