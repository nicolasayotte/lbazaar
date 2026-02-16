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
        try {
            $userWallet = $user->userWallet()->first();
            if (!$userWallet || !$userWallet->stake_key_hash) {
                return [
                    'success' => false,
                    'message' => 'User wallet not connected. Please connect your wallet first.'
                ];
            }

            $teacherWallet = $schedule->course->professor->userWallet()->first();
            $admin = $this->userRepository->getAdmin();
            $adminWallet = $admin->userWallet()->first();

            if (!$teacherWallet || !$adminWallet) {
                return [
                    'success' => false,
                    'message' => 'System wallets not configured. Please contact support.'
                ];
            }

            $adaTotalAmount = $this->convertJpyToAda($schedule->course->price);
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

            $response = $this->runCommand($cmd);
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
                    'cborTx' => $responseJSON['cborTx'],
                    'adaAmount' => $adaTotalAmount,
                    'teacherAmount' => $responseJSON['teacherAmount'] ?? null,
                    'adminAmount' => $responseJSON['adminAmount'] ?? null,
                ]
            ];

        } catch (Exception $e) {
            Log::error('Build purchase transaction failed', [
                'schedule_id' => $schedule->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to build purchase transaction: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Submit signed purchase transaction
     */
    public function submitPurchaseTransaction(CourseSchedule $schedule, User $user, string $cborSig, string $cborTx): array
    {
        try {
            $teacherWallet = $schedule->course->professor->userWallet()->first();
            $admin = $this->userRepository->getAdmin();
            $adminWallet = $admin->userWallet()->first();

            $cmd = $this->buildWeb3Command('run/submit-purchase-tx.mjs', [
                $cborSig,
                $cborTx,
                $teacherWallet->address,
                $adminWallet->address
            ]);

            $response = $this->runCommand($cmd);
            $responseJSON = json_decode($response, true);

            if (!is_array($responseJSON) || ($responseJSON['status'] ?? null) !== 200) {
                return [
                    'success' => false,
                    'message' => $responseJSON['error'] ?? 'Failed to submit transaction'
                ];
            }

            $txId = $responseJSON['txId'];
            $adaAmount = $responseJSON['teacherAmount'] ?? 0;

            // Create pending enrollment in a transaction
            $courseHistory = DB::transaction(function () use ($schedule, $user, $txId, $adaAmount) {
                $courseHistory = CourseHistory::create([
                    'course_schedule_id' => $schedule->id,
                    'course_id' => $schedule->course->id,
                    'user_id' => $user->id,
                    'payment_status' => 'pending',
                    'payment_tx_hash' => $txId,
                    'payment_ada_amount' => $adaAmount,
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

            return [
                'success' => true,
                'message' => 'Transaction submitted successfully. Waiting for blockchain confirmation.',
                'data' => [
                    'txId' => $txId,
                    'adaAmount' => $adaAmount,
                    'courseHistoryId' => $courseHistory->id
                ]
            ];

        } catch (Exception $e) {
            Log::error('Submit purchase transaction failed', [
                'schedule_id' => $schedule->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to submit purchase transaction: ' . $e->getMessage()
            ];
        }
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
