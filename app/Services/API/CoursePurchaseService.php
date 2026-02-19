<?php

namespace App\Services\API;

use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletTransactionHistory;
use App\Repositories\UserRepository;
use Exception;
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

        return [
            'success' => true,
            'message' => 'Transaction built successfully',
            'data' => [
                'cborTx'        => $responseJSON['cborTx'],
                'adaAmount'     => $adaTotalAmount,
                'teacherAmount' => $responseJSON['teacherAmount'] ?? null,
                'adminAmount'   => $responseJSON['adminAmount'] ?? null,
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
