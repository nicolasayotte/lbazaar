<?php

namespace App\Services\API;

use App\Models\CourseHistory;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RewardInvalidationService
{
    protected UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Invalidate rewards for a course history record when a refund occurs.
     *
     * MUST be called inside the caller's DB::transaction — this method does not
     * wrap its own transaction so that it participates in the outer atomic unit.
     *
     * Idempotent: if rewards_invalidated_at is already set, this is a no-op.
     *
     * @param CourseHistory $history  The locked CourseHistory record to invalidate.
     * @return array{success: bool, message: string, data?: array}
     */
    public function invalidateRewards(CourseHistory $history): array
    {
        // Idempotent: if already invalidated, do nothing
        if ($history->rewards_invalidated_at !== null) {
            return [
                'success' => true,
                'message' => 'Rewards already invalidated.',
            ];
        }

        $certificateRevoked = false;
        $tokenFlagged       = false;

        // Determine which rewards exist and need action
        $certStatus        = $history->certificate_status;
        $tokenStatus       = $history->token_reward_status;

        $certDelivered  = in_array($certStatus, ['minted', 'self_minted'], true);
        $tokenDelivered = in_array($tokenStatus, ['minted', 'minting'], true);

        // F-16.4: no rewards delivered = nothing to do
        if (!$certDelivered && !$tokenDelivered) {
            $history->update(['rewards_invalidated_at' => now()]);
            return [
                'success' => true,
                'message' => 'No rewards delivered; invalidation recorded.',
            ];
        }

        $updates = ['rewards_invalidated_at' => now()];

        // Revoke certificate if minted
        if ($certDelivered) {
            $updates['certificate_status'] = 'revoked';
            $certificateRevoked = true;
        }

        // F-16.5: flag token for clawback if minted or minting in progress
        if ($tokenDelivered) {
            $updates['token_reward_status'] = 'clawback_flagged';
            $tokenFlagged = true;
        }

        $history->update($updates);

        // Send notifications — failures are caught and logged, never propagated
        if ($certificateRevoked) {
            $this->notifyStudentCertificateRevoked($history);
            $this->notifyAdminCertificateRevoked($history);
        }

        if ($tokenFlagged) {
            $this->notifyAdminTokenClawback($history);
        }

        $actions = array_filter([
            $certificateRevoked ? 'certificate revoked' : null,
            $tokenFlagged ? 'token flagged for clawback' : null,
        ]);

        return [
            'success' => true,
            'message' => 'Rewards invalidated: ' . implode(', ', $actions) . '.',
            'data'    => [
                'certificate_revoked' => $certificateRevoked,
                'token_flagged'       => $tokenFlagged,
            ],
        ];
    }

    /**
     * Notify the student that their certificate has been revoked.
     */
    protected function notifyStudentCertificateRevoked(CourseHistory $history): void
    {
        try {
            DB::table('notifications')->insert([
                'from_user_id' => null,
                'to_user_id'   => $history->user_id,
                'message'      => 'Your certificate for course #' . $history->course_id . ' has been revoked due to a refund.',
                'is_read'      => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('RewardInvalidationService: failed to notify student of certificate revocation', [
                'course_history_id' => $history->id,
                'user_id'           => $history->user_id,
                'error'             => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify the admin that a certificate has been revoked and requires manual on-chain action.
     */
    protected function notifyAdminCertificateRevoked(CourseHistory $history): void
    {
        try {
            $admin = $this->userRepository->getAdmin();
            if (!$admin) {
                Log::warning('RewardInvalidationService: no admin user found for certificate revocation notification', [
                    'course_history_id' => $history->id,
                ]);
                return;
            }

            DB::table('notifications')->insert([
                'from_user_id' => null,
                'to_user_id'   => $admin->id,
                'message'      => 'Certificate revoked for user #' . $history->user_id . ' on course #' . $history->course_id . ' (history #' . $history->id . '). Manual on-chain action may be required.',
                'is_read'      => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('RewardInvalidationService: failed to notify admin of certificate revocation', [
                'course_history_id' => $history->id,
                'error'             => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify the admin that a token reward needs to be clawed back.
     */
    protected function notifyAdminTokenClawback(CourseHistory $history): void
    {
        try {
            $admin = $this->userRepository->getAdmin();
            if (!$admin) {
                Log::warning('RewardInvalidationService: no admin user found for token clawback notification', [
                    'course_history_id' => $history->id,
                ]);
                return;
            }

            DB::table('notifications')->insert([
                'from_user_id' => null,
                'to_user_id'   => $admin->id,
                'message'      => 'Token reward clawback required for user #' . $history->user_id . ' on course #' . $history->course_id . ' (history #' . $history->id . '). Token reward status has been flagged.',
                'is_read'      => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('RewardInvalidationService: failed to notify admin of token clawback', [
                'course_history_id' => $history->id,
                'error'             => $e->getMessage(),
            ]);
        }
    }
}
