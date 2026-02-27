<?php

namespace App\Services\API;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\Nft;
use App\Models\User;
use App\Models\UserWallet;
use App\Traits\Web3CommandTrait;
use Exception;
use Illuminate\Support\Facades\Log;

class TokenRewardService
{
    use Web3CommandTrait;

    /**
     * Update token reward configuration for a course.
     */
    public function updateTokenRewardConfig(Course $course, bool $enabled, ?int $amount): array
    {
        try {
            $course->token_reward_enabled = $enabled;
            $course->token_reward_amount  = $enabled ? $amount : null;
            $course->save();

            return [
                'success' => true,
                'message' => 'Token reward configuration updated.',
                'data'    => [
                    'token_reward_enabled' => $course->token_reward_enabled,
                    'token_reward_amount'  => $course->token_reward_amount,
                ],
            ];
        } catch (Exception $e) {
            Log::error('Failed to update token reward config', [
                'course_id' => $course->id,
                'error'     => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to update token reward configuration: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Mint and airdrop token reward to a single student.
     */
    public function mintAndAirdropTokenReward(Course $course, User $student, ?int $scheduleId = null): array
    {
        try {
            if (!$course->token_reward_enabled) {
                return [
                    'success' => false,
                    'message' => 'Token reward is not enabled for this course.',
                ];
            }

            if (empty($course->token_reward_amount) || $course->token_reward_amount < 1) {
                return [
                    'success' => false,
                    'message' => 'Token reward amount is not configured for this course.',
                ];
            }

            $walletAddress = $this->getStudentWalletAddress($student);
            $mintResult    = $this->mintTokenReward($course, $student, $walletAddress);

            if (!$mintResult['success']) {
                $this->updateTokenRewardStatus(
                    $course->id, $student->id, 'failed', $scheduleId
                );

                return [
                    'success'        => false,
                    'message'        => $mintResult['message'],
                    'wallet_address' => $walletAddress,
                ];
            }

            $this->updateTokenRewardStatus(
                $course->id,
                $student->id,
                'minted',
                $scheduleId,
                $mintResult['transaction_id']
            );

            return [
                'success'        => true,
                'message'        => 'Token reward minted and airdropped successfully.',
                'transaction_id' => $mintResult['transaction_id'],
                'wallet_address' => $walletAddress,
            ];

        } catch (Exception $e) {
            Log::error('Token reward minting failed', [
                'course_id'  => $course->id,
                'student_id' => $student->id,
                'error'      => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Token reward minting failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Resolve wallet address for airdrop (linked wallet or custodial).
     */
    protected function getStudentWalletAddress(User $student): string
    {
        $userWallet = $student->userWallet;

        if ($userWallet && $userWallet->stake_key_hash) {
            $wallet        = UserWallet::where('stake_key_hash', $userWallet->stake_key_hash)->first();
            $linkedAddress = $wallet ? $wallet->address : null;

            if (!empty($linkedAddress)) {
                return $linkedAddress;
            }

            Log::warning('Linked wallet address not found; falling back to custodial wallet', [
                'student_id'     => $student->id,
                'stake_key_hash' => $userWallet->stake_key_hash,
            ]);
        }

        if ($student->custodial_address) {
            return $student->custodial_address;
        }

        $command  = $this->buildWeb3Command('common/get-custodial-address.mjs', [(string) $student->id]);
        $response = $this->runCommand($command);
        $json     = json_decode($response, true);

        if (!is_array($json) || ($json['status'] ?? null) !== 200 || empty($json['address'])) {
            throw new Exception('Failed to derive custodial wallet address for student ' . $student->id);
        }

        return $json['address'];
    }

    /**
     * Execute the build + submit web3 pipeline for token reward minting.
     */
    protected function mintTokenReward(Course $course, User $student, string $walletAddress): array
    {
        try {
            $certificateNft = Nft::where('name', 'Certificate')->first();
            if (!$certificateNft) {
                throw new Exception('Certificate NFT template not found — cannot resolve minting policy hash');
            }

            $mph       = $certificateNft->mph;
            $tokenName = 'Token-' . $course->id;
            $quantity  = (string) $course->token_reward_amount;

            $buildCommand = $this->buildWeb3Command('run/build-token-reward-tx.mjs', [
                $walletAddress,
                $tokenName,
                $quantity,
                $mph,
            ]);

            $buildResponse = $this->runCommand($buildCommand);
            $buildJson     = json_decode($buildResponse, true);

            if (!is_array($buildJson) || ($buildJson['status'] ?? null) !== 200) {
                $error = $buildJson['error'] ?? 'Unknown error';
                return [
                    'success' => false,
                    'message' => 'Failed to build token reward transaction: ' . $error,
                ];
            }

            $cborTx = $buildJson['cborTx'] ?? null;
            if (empty($cborTx)) {
                return [
                    'success' => false,
                    'message' => 'Failed to build token reward transaction: Missing cborTx in response',
                ];
            }

            $submitCommand  = $this->buildWeb3Command('run/submit-certificate-tx.mjs', [$cborTx]);
            $submitResponse = $this->runCommand($submitCommand);
            $submitJson     = json_decode($submitResponse, true);

            if (!is_array($submitJson) || ($submitJson['status'] ?? null) !== 200) {
                $error = $submitJson['error'] ?? 'Unknown error';
                return [
                    'success' => false,
                    'message' => 'Failed to submit token reward transaction: ' . $error,
                ];
            }

            return [
                'success'        => true,
                'transaction_id' => $submitJson['txId'],
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Token reward minting error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Write token reward minting result back to course_histories.
     */
    public function updateTokenRewardStatus(
        int $courseId,
        int $studentId,
        string $status,
        ?int $scheduleId = null,
        ?string $txHash = null
    ): void {
        $query = CourseHistory::where('course_id', $courseId)->where('user_id', $studentId);

        if ($scheduleId !== null) {
            $query->where('course_schedule_id', $scheduleId);
        }

        $history = $query->first();

        if (!$history) {
            Log::warning('CourseHistory not found for token reward status update', [
                'course_id'   => $courseId,
                'student_id'  => $studentId,
                'schedule_id' => $scheduleId,
            ]);
            return;
        }

        $history->token_reward_status = $status;

        if ($txHash !== null) {
            $history->token_reward_tx_hash = $txHash;
        }

        if ($status === 'minted') {
            $history->token_reward_minted_at = now();
        }

        $history->save();

        Log::info('Token reward status updated', [
            'course_id'   => $courseId,
            'student_id'  => $studentId,
            'schedule_id' => $scheduleId,
            'status'      => $status,
            'tx_hash'     => $txHash,
        ]);
    }
}
