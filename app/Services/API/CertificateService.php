<?php

namespace App\Services\API;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\User;
use App\Models\UserExam;
use App\Models\UserWallet;
use App\Models\Nft;
use App\Models\NftTransactions;
use App\Services\API\TokenRewardService;
use App\Traits\Web3CommandTrait;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CertificateService
{
    use Web3CommandTrait;

    private const DEFAULT_ADMIN_USER_ID = 1;

    /**
     * Validate that the course has complete NFT certificate metadata before minting.
     * Satisfies F-05: incomplete metadata must be rejected with field-level detail.
     *
     * @param Course $course
     * @return array|null  null when valid; associative array of field => message when invalid.
     */
    public function validateCertificateConfig(Course $course): ?array
    {
        if (empty($course->certificate_enabled)) {
            return ['certificate_enabled' => 'Certificate reward is not enabled for this course.'];
        }

        $errors = [];

        if (empty($course->certificate_name)) {
            $errors['certificate_name'] = 'Certificate name is required when certificate reward is enabled.';
        }

        if (empty($course->certificate_description)) {
            $errors['certificate_description'] = 'Certificate description is required when certificate reward is enabled.';
        }

        // certificate_image_url is required at mint time
        $certificateNft = Nft::where('name', 'Certificate')->first();
        $hasDefaultImage = $certificateNft && !empty($certificateNft->image_url);

        if (empty($course->certificate_image_url) && !$hasDefaultImage) {
            $errors['certificate_image_url'] = 'Certificate image URL is required when certificate reward is enabled and no platform default image is configured.';
        }

        return empty($errors) ? null : $errors;
    }

    public function mintAndAirdropCertificate(Course $course, User $student, $scheduleId = null, ?CourseHistory $history = null)
    {
        try {
            // Duplicate-delivery guard: lock the course history row inside a transaction
            // to prevent concurrent airdrop calls both passing the eligibility check.
            // Returns ['claimed' => bool, 'prior_status' => string|null].
            $guardResult = DB::transaction(function () use ($course, $student, $scheduleId) {
                $query = CourseHistory::where('course_id', $course->id)
                    ->where('user_id', $student->id);

                if ($scheduleId !== null) {
                    $query->where('course_schedule_id', $scheduleId);
                }

                $row = $query->lockForUpdate()->first();

                if ($row && in_array($row->certificate_status, ['minted', 'self_minted', 'minting', 'pending', 'revoked'], true)) {
                    return ['claimed' => true, 'prior_status' => $row->certificate_status];
                }

                // Claim the slot under lock before the transaction releases,
                // so a concurrent caller sees 'minting' and treats it as taken.
                $priorStatus = $row ? $row->certificate_status : null;
                if ($row) {
                    $row->update(['certificate_status' => 'minting']);
                }

                return ['claimed' => false, 'prior_status' => $priorStatus];
            });

            if ($guardResult['claimed']) {
                return [
                    'success' => false,
                    'message' => 'Certificate already minted for this student.',
                ];
            }

            // Determine wallet address for airdrop
            $walletAddress = $this->getStudentWalletAddress($student);

            // Resolve override values from enrollment-time snapshot when available
            $certNameOverride        = $history?->effectiveCertificateName();
            $certDescriptionOverride = $history?->effectiveCertificateDescription();
            $certImageUrlOverride    = $history?->effectiveCertificateImageUrl();

            // Create certificate metadata
            $certificateData = $this->createCertificateMetadata($course, $student, $certNameOverride, $certDescriptionOverride);

            // F-07: If token reward is also enabled, resolve token args to mint both in one tx.
            // Use enrollment-time snapshot when history record is available.
            $tokenName     = null;
            $tokenQuantity = null;
            $effectiveTokenEnabled = $history !== null
                ? $history->effectiveTokenRewardEnabled()
                : !empty($course->token_reward_enabled);
            $effectiveTokenAmount = $history !== null
                ? $history->effectiveTokenRewardAmount()
                : ($course->token_reward_amount ?? null);
            $tokenEnabled  = $effectiveTokenEnabled && !empty($effectiveTokenAmount);
            if ($tokenEnabled) {
                $tokenName     = 'Token-' . $course->id;
                $tokenQuantity = (int) $effectiveTokenAmount;
            }

            // Mint the certificate NFT (and optionally token reward in same tx via F-07)
            $mintResult = $this->mintCertificateNFT($certificateData, $walletAddress, $certImageUrlOverride, $tokenName, $tokenQuantity);

            if (!$mintResult['success']) {
                // Roll back the 'minting' sentinel so the row is available for retry.
                $rollbackQuery = CourseHistory::where('course_id', $course->id)
                    ->where('user_id', $student->id);
                if ($scheduleId !== null) {
                    $rollbackQuery->where('course_schedule_id', $scheduleId);
                }
                $rollbackQuery->update(['certificate_status' => $guardResult['prior_status']]);

                return [
                    'success' => false,
                    'message' => 'Failed to mint certificate NFT: ' . $mintResult['message'],
                    'wallet_address' => $walletAddress
                ];
            }

            // Record the NFT transaction
            $this->recordNftTransaction($student->id, $mintResult, $certificateData);

            // Sync certificate status to 'minted' in course history
            $this->updateCertificateStatus(
                $course->id,
                $student->id,
                'minted',
                $scheduleId,
                $mintResult['transaction_id']
            );

            // F-07: If token reward was included in this transaction, update its status too.
            if ($tokenEnabled && ($mintResult['token_included'] ?? false)) {
                try {
                    /** @var TokenRewardService $tokenRewardService */
                    $tokenRewardService = app(TokenRewardService::class);
                    $tokenRewardService->updateTokenRewardStatus(
                        $course->id,
                        $student->id,
                        'minted',
                        $scheduleId,
                        $mintResult['transaction_id']
                    );
                } catch (Exception $tokenEx) {
                    Log::error('CertificateService: failed to update token reward status after combined mint', [
                        'course_id'  => $course->id,
                        'student_id' => $student->id,
                        'error'      => $tokenEx->getMessage(),
                    ]);
                }
            }

            // Send notification email (optional)
            $this->sendCertificateNotification($student, $course, $mintResult);

            return [
                'success'        => true,
                'message'        => 'Certificate minted and airdropped successfully',
                'transaction_id' => $mintResult['transaction_id'],
                'wallet_address' => $walletAddress,
                'nft_metadata'   => $certificateData,
                'token_included' => $tokenEnabled && ($mintResult['token_included'] ?? false),
            ];

        } catch (Exception $e) {
            Log::error('Certificate minting failed', [
                'course_id' => $course->id,
                'student_id' => $student->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Certificate minting failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get wallet address for student (linked wallet or custodial)
     * 
     * @param User $student
     * @return string
     */
    protected function getStudentWalletAddress(User $student)
    {
        $userWallet = $student->userWallet;

        if ($userWallet && $userWallet->stake_key_hash) {
            $linkedAddress = $this->getLinkedWalletAddress($userWallet->stake_key_hash);

            if (!empty($linkedAddress)) {
                return $linkedAddress;
            }

            Log::warning('Linked wallet address not found; falling back to custodial wallet', [
                'student_id' => $student->id,
                'stake_key_hash' => $userWallet->stake_key_hash
            ]);
        }

        if ($student->custodial_address) {
            return $student->custodial_address;
        }

        $custodialAddress = $this->getCustodialWalletAddress($student->id);

        if (!empty($custodialAddress)) {
            return $custodialAddress;
        }

        throw new Exception('No valid wallet address found for student ' . $student->id);
    }

    /**
     * Create certificate metadata
     *
     * @param Course $course
     * @param User $student
     * @param string|null $certName          Override for the certificate name (from enrollment snapshot).
     * @param string|null $certDescription   Override for the certificate description (from enrollment snapshot).
     * @return array
     */
    public function createCertificateMetadata(Course $course, User $student, ?string $certName = null, ?string $certDescription = null)
    {
        $timestamp = now();
        $serialNumber = $timestamp->timestamp;

        return [
            'name' => $certName ?? 'Certificate of Completion',
            'description' => $certDescription,
            'course_title' => $course->title,
            'student_name' => $student->fullname,
            'student_email' => $student->email,
            'teacher_name' => $course->professor->fullname,
            'completion_date' => $timestamp->format('Y-m-d'),
            'serial_number' => $serialNumber,
            'course_id' => $course->id,
            'student_id' => $student->id
        ];
    }

    /**
     * Mint certificate NFT using web3 scripts
     *
     * @param array $certificateData
     * @param string $walletAddress
     * @param string|null $imageUrlOverride  Override image URL from enrollment-time snapshot.
     * @param string|null $tokenName         Optional: fungible token name to mint in same tx (F-07).
     * @param int|null $tokenQuantity        Optional: quantity of fungible tokens to mint (F-07).
     * @return array
     */
    protected function mintCertificateNFT($certificateData, $walletAddress, ?string $imageUrlOverride = null, ?string $tokenName = null, ?int $tokenQuantity = null)
    {
        try {
            $metadataJson = json_encode($certificateData);

            if ($metadataJson === false) {
                throw new Exception('Failed to encode certificate metadata');
            }

            // Create NFT name and metadata
            $nftName = 'Cert-' . $certificateData['course_id'] . '-' . $certificateData['student_id'];
            $serialNum = $certificateData['serial_number'];

            $certificateNft = Nft::where('name', 'Certificate')->first();
            $imageUrl = $imageUrlOverride ?? ($certificateNft?->image_url ?? '');

            // F-07: Build args — append optional token reward args when provided
            $buildArgs = [
                $walletAddress,
                $nftName,
                $serialNum,
                $imageUrl,
                $metadataJson,
            ];

            $includeToken = $tokenName !== null && $tokenQuantity !== null && $tokenQuantity > 0;
            if ($includeToken) {
                $buildArgs[] = $tokenName;
                $buildArgs[] = (string) $tokenQuantity;
            }

            $buildCommand = $this->buildWeb3Command('run/build-certificate-tx.mjs', $buildArgs);

            $response = $this->runCommand($buildCommand);
            $responseJSON = json_decode($response, true);

            if (is_array($responseJSON) && ($responseJSON['status'] ?? null) === 200) {
                $cborTx = $responseJSON['cborTx'] ?? null;

                if (empty($cborTx)) {
                    return [
                        'success' => false,
                        'message' => 'Failed to build minting transaction: Missing cborTx in response'
                    ];
                }

                $submitCommand = $this->buildWeb3Command('run/submit-certificate-tx.mjs', [
                    $cborTx
                ]);

                $submitResponse = $this->runCommand($submitCommand);
                $submitResponseJSON = json_decode($submitResponse, true);

                if (is_array($submitResponseJSON) && ($submitResponseJSON['status'] ?? null) === 200) {
                    return [
                        'success'        => true,
                        'transaction_id' => $submitResponseJSON['txId'],
                        'nft_name'       => $nftName,
                        'serial_number'  => $serialNum,
                        'mph'            => $responseJSON['mph'] ?? '',
                        'token_included' => $includeToken,
                        'token_name'     => $includeToken ? $tokenName : null,
                        'token_quantity' => $includeToken ? $tokenQuantity : null,
                    ];
                }

                $errorMessage = $submitResponseJSON['error'] ?? 'Unknown error';

                return [
                    'success' => false,
                    'message' => 'Failed to submit minting transaction: ' . $errorMessage
                ];
            }

            $errorMessage = $responseJSON['error'] ?? 'Unknown error';

            return [
                'success' => false,
                'message' => 'Failed to build minting transaction: ' . $errorMessage
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'NFT minting error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Retrieve the custodial wallet address via Node script.
     *
     * @param int $userId
     * @return string
     * @throws Exception
     */
    protected function getCustodialWalletAddress(int $userId)
    {
        $command = $this->buildWeb3Command('common/get-custodial-address.mjs', [
            (string) $userId
        ]);

        $response = $this->runCommand($command);
        $responseJson = json_decode($response, true);

        if (!is_array($responseJson) || ($responseJson['status'] ?? null) !== 200 || empty($responseJson['address'])) {
            Log::error('Failed to derive custodial wallet address', [
                'user_id' => $userId,
                'response' => $response
            ]);

            throw new Exception('Failed to derive custodial wallet address');
        }

        return $responseJson['address'];
    }

    /**
     * Retrieve a linked wallet address based on stake key hash.
     *
     * @param string $stakeKeyHash
     * @return string|null
     */
    protected function getLinkedWalletAddress(string $stakeKeyHash): ?string
    {
        $wallet = UserWallet::where('stake_key_hash', $stakeKeyHash)->first();

        return $wallet ? $wallet->address : null;
    }

    /**
     * Resolve a user ID from a stake key hash (defaults to admin user ID when not found).
     *
     * @param string|null $stakeKeyHash
     * @return int
     */
    protected function getUserIdFromStakeKey(?string $stakeKeyHash): int
    {
        if (empty($stakeKeyHash)) {
            return self::DEFAULT_ADMIN_USER_ID;
        }

        $wallet = UserWallet::where('stake_key_hash', $stakeKeyHash)->first();

        return $wallet ? $wallet->user_id : self::DEFAULT_ADMIN_USER_ID;
    }

    /**
     * Record NFT transaction in database
     * 
     * @param int $studentId
     * @param array $mintResult
     * @param array $certificateData
     * @return void
     */
    protected function recordNftTransaction($studentId, $mintResult, $certificateData)
    {
        try {
            // Get the certificate NFT template to use as the nft_id
            $certificateNft = Nft::where('name', 'Certificate')->first();
            if (!$certificateNft) {
                throw new Exception('Certificate NFT template not found for transaction recording');
            }

            NftTransactions::create([
                'user_id' => $studentId,
                'nft_id' => $certificateNft->id,
                'nft_name' => $mintResult['nft_name'],
                'serial_num' => $mintResult['serial_number'],
                'tx_id' => $mintResult['transaction_id'],
                'mph' => $mintResult['mph'],
                'metadata' => json_encode($certificateData),
                'used' => 0,
                'course_id' => $certificateData['course_id'] ?? null,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            Log::info('Certificate NFT transaction recorded', [
                'student_id' => $studentId,
                'transaction_id' => $mintResult['transaction_id'],
                'nft_name' => $mintResult['nft_name']
            ]);

        } catch (Exception $e) {
            Log::error('Failed to record NFT transaction', [
                'student_id' => $studentId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Derive the certificate minting policy hash from the configured lock date.
     *
     * @return string|null  The policy hash hex string, or null on failure.
     */
    public function deriveCertificatePolicyId(): ?string
    {
        try {
            $command = $this->buildWeb3Command('run/derive-certificate-mph.mjs');
            $response = $this->runCommand($command);
            $data = json_decode($response, true);

            if (is_array($data) && ($data['status'] ?? null) === 200) {
                return $data['mph'];
            }

            Log::error('Failed to derive certificate policy ID', ['response' => $response]);
            return null;
        } catch (Exception $e) {
            Log::error('Exception deriving certificate policy ID', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send certificate notification email to student
     *
     * @param User $student
     * @param Course $course
     * @param array $mintResult
     * @return void
     */
    protected function sendCertificateNotification($student, $course, $mintResult)
    {
        try {
            // This would integrate with your existing email service
            // For now, just log the notification
            Log::info('Certificate notification sent', [
                'student_id' => $student->id,
                'student_email' => $student->email,
                'course_title' => $course->title,
                'transaction_id' => $mintResult['transaction_id']
            ]);

            // TODO: Implement actual email sending
            // $this->emailService->sendCertificateNotification($student, $course, $mintResult);

        } catch (Exception $e) {
            Log::error('Failed to send certificate notification', [
                'student_id' => $student->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Dispatch an in-app notification if the course has rewards and
     * no notification has been sent yet (idempotent via rewards_notification_sent_at).
     */
    public function dispatchCompletionNotificationIfEligible(CourseHistory $booking): void
    {
        if ($booking->rewards_notification_sent_at !== null) {
            return;
        }

        $certEnabled  = $booking->effectiveCertificateEnabled();
        $tokenEnabled = $booking->effectiveTokenRewardEnabled();

        if (!$certEnabled && !$tokenEnabled) {
            return;
        }

        $course = $booking->course ?? $booking->course()->first();

        if ($certEnabled && $tokenEnabled) {
            $langKey = 'translatables.texts.reward_notification_both';
        } elseif ($certEnabled) {
            $langKey = 'translatables.texts.reward_notification_cert_only';
        } else {
            $langKey = 'translatables.texts.reward_notification_token_only';
        }

        $message = __($langKey, ['course' => $course->title ?? '']);

        $this->notifyStudentRewardsAvailable($booking, $message);
    }

    /**
     * Insert the in-app notification row and stamp rewards_notification_sent_at.
     * Wrapped in try/catch — notification failure must never abort completion.
     */
    protected function notifyStudentRewardsAvailable(CourseHistory $booking, string $message): void
    {
        try {
            DB::table('notifications')->insert([
                'from_user_id' => null,
                'to_user_id'   => $booking->user_id,
                'message'      => $message,
                'is_read'      => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            $booking->update(['rewards_notification_sent_at' => now()]);
        } catch (\Throwable $e) {
            Log::warning('CertificateService: failed to send reward notification', [
                'course_history_id' => $booking->id,
                'user_id'           => $booking->user_id,
                'error'             => $e->getMessage(),
            ]);
        }
    }

    /**
     * Update certificate status in course history
     *
     * @param int $courseId
     * @param int $studentId
     * @param string $status
     * @param int|null $scheduleId
     * @param string|null $txHash
     * @return void
     */
    public function updateCertificateStatus(
        int $courseId,
        int $studentId,
        string $status,
        ?int $scheduleId = null,
        ?string $txHash = null
    ): void
    {
        // Build query
        $query = CourseHistory::where('course_id', $courseId)
            ->where('user_id', $studentId);

        // Add schedule_id filter if provided
        if ($scheduleId !== null) {
            $query->where('course_schedule_id', $scheduleId);
        }

        // Get the course history record
        $courseHistory = $query->first();

        if (!$courseHistory) {
            Log::warning('Course history not found for certificate status update', [
                'course_id' => $courseId,
                'student_id' => $studentId,
                'schedule_id' => $scheduleId,
                'status' => $status
            ]);
            return;
        }

        // Update certificate status
        $courseHistory->certificate_status = $status;

        // Save tx_hash if provided
        if ($txHash !== null) {
            $courseHistory->certificate_tx_hash = $txHash;
        }

        // Set certificate_minted_at if status is 'minted' or 'self_minted'
        if ($status === 'minted' || $status === 'self_minted') {
            $courseHistory->certificate_minted_at = now();
        }

        $courseHistory->save();

        // Log the status change
        Log::info('Certificate status updated', [
            'course_id' => $courseId,
            'student_id' => $studentId,
            'schedule_id' => $scheduleId,
            'status' => $status,
            'tx_hash' => $txHash
        ]);
    }

    /**
     * Get eligible students with certificate status for a course
     *
     * @param Course $course
     * @return array
     */
    public function getEligibleStudentsWithStatus(Course $course): array
    {
        try {
            // Get all completed course histories
            $completedHistories = CourseHistory::with(['user', 'user.userWallet', 'courseSchedule'])
                ->where('course_id', $course->id)
                ->whereNotNull('completed_at')
                ->where(function($q) {
                    $q->where('is_cancelled', false)
                      ->orWhere('is_cancelled', 0)
                      ->orWhereNull('is_cancelled');
                })
                ->get();

            $students = [];

            foreach ($completedHistories as $history) {
                $student = $history->user;

                if (!$student) {
                    continue;
                }

                // Check if student has passed all exams
                $hasPassedExams = $this->hasPassedAllExams(
                    $student->id,
                    $history->course_schedule_id
                );

                if (!$hasPassedExams) {
                    continue;
                }

                // Get certificate transaction if exists
                $certificateTransaction = NftTransactions::where('user_id', $student->id)
                    ->where('course_id', $course->id)
                    ->first();

                // Determine status
                $status = 'eligible';
                $txHash = null;
                $mintedAt = null;

                if ($certificateTransaction) {
                    $status = 'minted';
                    $txHash = $certificateTransaction->tx_id;
                    $mintedAt = $certificateTransaction->created_at;
                }

                $students[] = [
                    'id' => $student->id,
                    'name' => $student->fullname,
                    'email' => $student->email,
                    'completed_at' => $history->completed_at,
                    'certificate_status' => $status,
                    'tx_hash' => $txHash,
                    'minted_at' => $mintedAt,
                ];
            }

            return [
                'success' => true,
                'message' => 'Eligible students retrieved successfully',
                'data' => [
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'students' => $students,
                    'total_eligible' => count($students)
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to get eligible students with status', [
                'course_id' => $course->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to retrieve eligible students: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get certificate status for a specific student in a course
     *
     * @param Course $course
     * @param User $student
     * @return array
     */
    public function getCertificateStatusForStudent(Course $course, User $student): array
    {
        try {
            // Check if student completed the course
            $courseHistory = CourseHistory::where('course_id', $course->id)
                ->where('user_id', $student->id)
                ->whereNotNull('completed_at')
                ->where(function($q) {
                    $q->where('is_cancelled', false)
                      ->orWhere('is_cancelled', 0)
                      ->orWhereNull('is_cancelled');
                })
                ->first();

            if (!$courseHistory) {
                return [
                    'success' => false,
                    'message' => 'Student has not completed this course',
                    'data' => [
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'status' => 'not_completed'
                    ]
                ];
            }

            // Check if student passed all exams
            $hasPassedExams = $this->hasPassedAllExams(
                $student->id,
                $courseHistory->course_schedule_id
            );

            if (!$hasPassedExams) {
                return [
                    'success' => false,
                    'message' => 'Student has not passed all required exams',
                    'data' => [
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'status' => 'not_eligible'
                    ]
                ];
            }

            // Get certificate transaction if exists
            $certificateTransaction = NftTransactions::where('user_id', $student->id)
                ->where('course_id', $course->id)
                ->first();

            if ($certificateTransaction) {
                // Certificate already minted
                $explorerUrl = config('services.cardano.explorer_url') . '/transaction/' . $certificateTransaction->tx_id;

                return [
                    'success' => true,
                    'message' => 'Certificate already minted',
                    'data' => [
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'status' => 'minted',
                        'tx_hash' => $certificateTransaction->tx_id,
                        'explorer_url' => $explorerUrl,
                        'minted_at' => $certificateTransaction->created_at,
                        'nft_name' => $certificateTransaction->nft_name,
                        'metadata' => json_decode($certificateTransaction->metadata, true)
                    ]
                ];
            }

            // Student is eligible but certificate not minted yet
            return [
                'success' => true,
                'message' => 'Student is eligible for certificate',
                'data' => [
                    'student_id' => $student->id,
                    'course_id' => $course->id,
                    'status' => 'eligible',
                    'completed_at' => $courseHistory->completed_at
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to get certificate status for student', [
                'course_id' => $course->id,
                'student_id' => $student->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to retrieve certificate status: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Perform on-chain metadata revocation for a minted or self-minted certificate.
     *
     * Calls `web3/run/revoke-certificate-tx.mjs` which:
     *   1. Loads the nft-minting-policy with OWNER_PKH + LOCK_DATE.
     *   2. Verifies the compiled policy hash matches the stored policyId.
     *   3. Builds a tx with updated CIP-25 metadata (revoked: true, revoked_at: <ts>).
     *   4. Burns the reference (100) token if the lock date has not passed.
     *   5. Signs with the owner key and submits to Blockfrost.
     *
     * Failure is logged and returned — it must NOT abort the DB-level revocation.
     *
     * @param string $txHash        Original minting transaction hash (for logging/reference).
     * @param int    $studentId
     * @param int    $courseId
     * @param string $nftName       E.g. 'Cert-5-12'
     * @param string $serialNum     Timestamp-based serial number used at mint time.
     * @param string $policyId      Hex policy ID of the minting policy.
     * @param int    $courseHistoryId
     * @return array{success: bool, txHash?: string, message: string}
     */
    public function revokeCertificateOnChain(
        string $txHash,
        int    $studentId,
        int    $courseId,
        string $nftName,
        string $serialNum,
        string $policyId,
        int    $courseHistoryId
    ): array {
        try {
            $revokeCommand = $this->buildWeb3Command('run/revoke-certificate-tx.mjs', [
                $nftName,
                $serialNum,
                $policyId,
                (string) $courseHistoryId,
            ]);

            $response     = $this->runCommand($revokeCommand);
            $responseJSON = json_decode($response, true);

            if (is_array($responseJSON) && ($responseJSON['status'] ?? null) === 200) {
                Log::info('Certificate revoked on-chain', [
                    'course_history_id' => $courseHistoryId,
                    'student_id'        => $studentId,
                    'course_id'         => $courseId,
                    'revoke_tx_hash'    => $responseJSON['txHash'],
                    'original_tx_hash'  => $txHash,
                ]);

                return [
                    'success' => true,
                    'txHash'  => $responseJSON['txHash'],
                    'message' => 'On-chain revocation transaction submitted.',
                ];
            }

            $errorMsg = $responseJSON['error'] ?? 'Unknown error from revoke-certificate-tx.mjs';
            Log::error('On-chain certificate revocation failed', [
                'course_history_id' => $courseHistoryId,
                'student_id'        => $studentId,
                'error'             => $errorMsg,
            ]);

            return [
                'success' => false,
                'message' => 'On-chain revocation failed: ' . $errorMsg,
            ];

        } catch (\Throwable $e) {
            Log::error('Exception during on-chain certificate revocation', [
                'course_history_id' => $courseHistoryId,
                'error'             => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'On-chain revocation exception: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Revoke a self-minted certificate when a refund occurs.
     *
     * Gap 4b: RewardInvalidationService only revokes 'minted' status — not 'self_minted'.
     * This method handles the self_minted case. It can be called from any controller
     * that handles refund-adjacent operations (e.g., admin certificate revocation).
     *
     * Sequence:
     *   1. Lock DB row, validate status, update to 'revoked'.
     *   2. Attempt on-chain revocation (failure is non-fatal — logged, not thrown).
     *   3. Notify student.
     *
     * Never throws — failure is logged and returned.
     *
     * @param int $courseHistoryId
     * @return array{success: bool, message: string}
     */
    public function revokeSelfMintedCertificate(int $courseHistoryId): array
    {
        try {
            $dbResult = DB::transaction(function () use ($courseHistoryId) {
                $history = CourseHistory::lockForUpdate()->findOrFail($courseHistoryId);

                if ($history->certificate_status !== 'self_minted') {
                    return [
                        'success' => false,
                        'message' => "Certificate status is '{$history->certificate_status}'; only 'self_minted' certificates can be revoked via this method.",
                        'history' => null,
                    ];
                }

                if ($history->rewards_invalidated_at !== null) {
                    return [
                        'success' => true,
                        'message' => 'Certificate already invalidated.',
                        'history' => null,
                    ];
                }

                $history->update([
                    'certificate_status'     => 'revoked',
                    'rewards_invalidated_at' => now(),
                ]);

                return [
                    'success' => true,
                    'message' => 'Self-minted certificate revoked successfully.',
                    'history' => $history,
                ];
            });

            if (!$dbResult['success'] || $dbResult['history'] === null) {
                return ['success' => $dbResult['success'], 'message' => $dbResult['message']];
            }

            $history = $dbResult['history'];

            // Attempt on-chain revocation — failure is non-fatal
            if ($history->certificate_tx_hash && $history->certificate_policy_id ?? false) {
                $nftName   = 'Cert-' . $history->course_id . '-' . $history->user_id;
                $serialNum = $history->certificate_serial_number ?? '';

                if ($serialNum) {
                    $this->revokeCertificateOnChain(
                        $history->certificate_tx_hash,
                        $history->user_id,
                        $history->course_id,
                        $nftName,
                        $serialNum,
                        $history->certificate_policy_id,
                        $history->id
                    );
                }
            }

            // Notify student
            try {
                DB::table('notifications')->insert([
                    'from_user_id' => null,
                    'to_user_id'   => $history->user_id,
                    'message'      => 'Your self-minted certificate for course #' . $history->course_id . ' has been revoked due to a refund.',
                    'is_read'      => false,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('CertificateService: failed to notify student of self-minted certificate revocation', [
                    'course_history_id' => $history->id,
                    'user_id'           => $history->user_id,
                    'error'             => $e->getMessage(),
                ]);
            }

            return [
                'success' => true,
                'message' => 'Self-minted certificate revoked successfully.',
                'data'    => ['course_history_id' => $courseHistoryId],
            ];

        } catch (\Throwable $e) {
            Log::error('CertificateService: failed to revoke self-minted certificate', [
                'course_history_id' => $courseHistoryId,
                'error'             => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to revoke self-minted certificate: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get unified rewards view for a student — certificates and token rewards.
     *
     * Returns one row per eligible reward type per completed course history.
     *
     * @param int $userId
     * @return array
     */
    public function getStudentRewards(int $userId): array
    {
        try {
            $histories = CourseHistory::where('user_id', $userId)
                ->whereNotNull('completed_at')
                ->where(function ($q) {
                    $q->where('is_cancelled', false)
                      ->orWhere('is_cancelled', 0)
                      ->orWhereNull('is_cancelled');
                })
                ->with(['course.professor', 'possibleCertificateTransactions', 'user.userWallet'])
                ->orderBy('completed_at', 'desc')
                ->get();

            $rewards = [];

            foreach ($histories as $history) {
                $course = $history->course;

                if (!$course) {
                    continue;
                }

                $revoked = $history->rewards_invalidated_at !== null;
                $revokedAt = $history->rewards_invalidated_at;

                // Determine wallet destination
                $userWallet = $history->user?->userWallet;
                $walletDestination = ($userWallet && $userWallet->stake_key_hash) ? 'external' : 'custodial';

                $professor = $course->professor;
                $professorName = $professor ? $professor->fullname : '';

                // --- Certificate reward row ---
                if ($history->effectiveCertificateEnabled()) {
                    $certTx = $history->certificateTransaction;
                    $certStatus = $this->resolveCertificateDeliveryStatus($history, $certTx, $revoked);
                    $certTxHash = $certTx ? $certTx->tx_id : ($history->certificate_tx_hash ?? null);
                    $explorerUrl = null;
                    if ($certTxHash) {
                        $explorerUrl = config('services.cardano.explorer_url') . '/transaction/' . $certTxHash;
                    }
                    $nftMetadata = null;
                    if ($certTx && $certTx->metadata) {
                        $nftMetadata = json_decode($certTx->metadata, true);
                    }

                    $rewards[] = [
                        'id'                 => 'cert-' . $history->id,
                        'course_history_id'  => $history->id,
                        'course_id'          => $history->course_id,
                        'schedule_id'        => $history->course_schedule_id,
                        'course_name'        => $course->title,
                        'professor_name'     => $professorName,
                        'reward_type'        => 'certificate',
                        'amount'             => null,
                        'delivery_date'      => $history->certificate_minted_at?->toISOString(),
                        'delivery_status'    => $certStatus,
                        'wallet_destination' => $walletDestination,
                        'wallet_type'        => $walletDestination,
                        'tx_hash'            => $certTxHash,
                        'explorer_url'       => $explorerUrl,
                        'nft_metadata'       => $nftMetadata,
                        'completed_at'       => $history->completed_at,
                        'revoked_at'         => $revokedAt?->toISOString(),
                    ];
                }

                // --- Token reward row ---
                if ($history->effectiveTokenRewardEnabled()) {
                    $tokenStatus = $this->resolveTokenDeliveryStatus($history, $revoked);
                    $tokenTxHash = $history->token_reward_tx_hash ?? null;
                    $tokenExplorerUrl = null;
                    if ($tokenTxHash) {
                        $tokenExplorerUrl = config('services.cardano.explorer_url') . '/transaction/' . $tokenTxHash;
                    }

                    $rewards[] = [
                        'id'                 => 'token-' . $history->id,
                        'course_history_id'  => $history->id,
                        'course_id'          => $history->course_id,
                        'schedule_id'        => $history->course_schedule_id,
                        'course_name'        => $course->title,
                        'professor_name'     => $professorName,
                        'reward_type'        => 'token',
                        'amount'             => $history->effectiveTokenRewardAmount(),
                        'delivery_date'      => $history->token_reward_minted_at?->toISOString(),
                        'delivery_status'    => $tokenStatus,
                        'wallet_destination' => $walletDestination,
                        'wallet_type'        => $walletDestination,
                        'tx_hash'            => $tokenTxHash,
                        'explorer_url'       => $tokenExplorerUrl,
                        'nft_metadata'       => null,
                        'completed_at'       => $history->completed_at,
                        'revoked_at'         => $revokedAt?->toISOString(),
                    ];
                }
            }

            return [
                'success' => true,
                'message' => 'Rewards retrieved successfully',
                'data'    => [
                    'rewards' => $rewards,
                ],
            ];

        } catch (Exception $e) {
            Log::error('Failed to retrieve student rewards', [
                'user_id' => $userId,
                'error'   => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to retrieve rewards: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Resolve the delivery status for a certificate reward row.
     *
     * @param CourseHistory    $history
     * @param mixed|null       $certTx
     * @param bool             $revoked
     * @return string
     */
    private function resolveCertificateDeliveryStatus(CourseHistory $history, $certTx, bool $revoked): string
    {
        if ($revoked) {
            return 'revoked';
        }

        if ($certTx) {
            return 'minted';
        }

        $status = $history->certificate_status ?? 'eligible';

        return match ($status) {
            'minted', 'self_minted' => 'minted',
            'minting' => 'minting',
            'pending' => 'pending',
            'failed'  => 'failed',
            default   => 'eligible',
        };
    }

    /**
     * Resolve the delivery status for a token reward row.
     *
     * @param CourseHistory $history
     * @param bool          $revoked
     * @return string
     */
    private function resolveTokenDeliveryStatus(CourseHistory $history, bool $revoked): string
    {
        if ($revoked) {
            return 'revoked';
        }

        $status = $history->token_reward_status ?? 'eligible';

        return match ($status) {
            'minted', 'self_minted'  => 'minted',
            'minting'                => 'minting',
            'pending'                => 'pending',
            'failed'                 => 'failed',
            'clawback_flagged'       => 'clawback_flagged',
            default                  => 'eligible',
        };
    }

    /**
     * Get all certificates earned by a student
     *
     * @param int $userId
     * @return array
     */
    public function getStudentCertificates(int $userId): array
    {
        try {
            $certificates = CourseHistory::where('user_id', $userId)
                ->whereNotNull('completed_at')
                ->where('is_cancelled', false)
                ->whereHas('course', function($q) {
                    $q->where('certificate_enabled', true);
                })
                ->with(['course.professor'])
                ->orderBy('completed_at', 'desc')
                ->get()
                ->map(function($history) {
                    return [
                        'id' => $history->id,
                        'course_id' => $history->course_id,
                        'course_name' => $history->course->title,
                        'professor_name' => $history->course->professor->fullname,
                        'completed_at' => $history->completed_at,
                        'certificate_status' => $history->certificate_status ?? 'not_eligible',
                        'certificate_tx_hash' => $history->certificate_tx_hash,
                        'certificate_minted_at' => $history->certificate_minted_at,
                        'certificate_image_url' => $history->certificate_image_url,
                        'certificate_explorer_url' => $history->certificate_explorer_url,
                    ];
                })
                ->values()
                ->toArray();

            return [
                'success' => true,
                'message' => 'Certificates retrieved successfully',
                'data' => [
                    'certificates' => $certificates
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to retrieve student certificates', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to retrieve certificates: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if a student has passed all exams for a specific course schedule
     *
     * @param int $studentId
     * @param int $scheduleId
     * @return bool
     */
    protected function hasPassedAllExams(int $studentId, int $scheduleId): bool
    {
        // Import UserExam model if not already imported
        if (!class_exists('App\Models\UserExam')) {
            return true; // If no exam system, consider as passed
        }

        // Get total exams for this schedule
        $totalExams = UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->count();

        // Get passed exams for this schedule
        $passedExams = UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->where('is_passed', 1)
            ->count();

        // If no exams exist, consider as passed (some courses might not have exams)
        if ($totalExams === 0) {
            return true;
        }

        // All exams must be passed
        return $totalExams === $passedExams;
    }

    /**
     * Estimate total ADA cost for an airdrop.
     *
     * @param Course $course
     * @param int $studentCount
     * @param bool $includeCertificate
     * @param bool $includeToken
     * @param int $walletBalanceLovelace
     * @return array
     */
    public function estimateAirdropFee(
        Course $course,
        int $studentCount,
        bool $includeCertificate,
        bool $includeToken,
        int $walletBalanceLovelace
    ): array {
        $minAda   = (int) config('services.cardano.min_ada', 2000000);
        $maxTxFee = (int) config('services.cardano.max_tx_fee', 500000);
        $perStudentLovelace = 0;

        if ($includeCertificate && $course->certificate_enabled) {
            $perStudentLovelace += $minAda + $maxTxFee;
        }
        if ($includeToken && !empty($course->token_reward_enabled)) {
            $perStudentLovelace += $minAda + $maxTxFee;
        }

        $totalLovelace = $perStudentLovelace * $studentCount;
        $insufficient  = $walletBalanceLovelace < $totalLovelace;
        $shortfall     = $insufficient ? ($totalLovelace - $walletBalanceLovelace) : 0;

        return [
            'success' => true,
            'message' => 'Fee estimated successfully',
            'data' => [
                'student_count'           => $studentCount,
                'per_student_lovelace'    => $perStudentLovelace,
                'fee_lovelace'            => $totalLovelace,
                'fee_ada'                 => round($totalLovelace / 1_000_000, 2),
                'insufficient'            => $insufficient,
                'shortfall_lovelace'      => $shortfall,
                'wallet_balance_lovelace' => $walletBalanceLovelace,
            ],
        ];
    }

    /**
     * Get certificate data for course completion confirmation page
     *
     * @param int $courseId
     * @param int $studentId
     * @param int $scheduleId
     * @return array|null
     */
    public function getCertificateDataForCompletion(int $courseId, int $studentId, int $scheduleId): ?array
    {
        try {
            // Find course history record
            $courseHistory = CourseHistory::where('user_id', $studentId)
                ->where('course_id', $courseId)
                ->where('course_schedule_id', $scheduleId)
                ->first();

            // Return null if course not completed
            if (!$courseHistory || !$courseHistory->completed_at) {
                return null;
            }

            // Determine certificate status
            $certificateStatus = $courseHistory->certificate_status ?? 'not_eligible';
            $explorerUrl = null;

            // Build explorer URL if certificate is minted
            if (in_array($certificateStatus, ['minted', 'self_minted']) && $courseHistory->certificate_tx_hash) {
                $explorerUrl = config('services.cardano.explorer_url') . '/transaction/' . $courseHistory->certificate_tx_hash;
            }

            return [
                'status' => $certificateStatus,
                'tx_hash' => $courseHistory->certificate_tx_hash,
                'explorer_url' => $explorerUrl,
                'minted_at' => $courseHistory->certificate_minted_at,
            ];

        } catch (Exception $e) {
            Log::error('Failed to get certificate data for completion', [
                'course_id' => $courseId,
                'student_id' => $studentId,
                'schedule_id' => $scheduleId,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Get unified reward eligibility data for the student self-mint confirmation page.
     *
     * Returns null if the student has no completed CourseHistory for this course/schedule.
     * Otherwise returns a structured array describing certificate and token reward
     * eligibility, current status, and fee estimates.
     *
     * @param int $courseId
     * @param int $studentId
     * @param int $scheduleId
     * @return array|null
     */
    public function getSelfMintEligibility(int $courseId, int $studentId, int $scheduleId): ?array
    {
        try {
            $courseHistory = CourseHistory::where('user_id', $studentId)
                ->where('course_id', $courseId)
                ->where('course_schedule_id', $scheduleId)
                ->first();

            if (!$courseHistory || !$courseHistory->completed_at) {
                return null;
            }

            $minAda       = (int) config('services.cardano.min_ada', 2_000_000);
            $maxTxFee     = (int) config('services.cardano.max_tx_fee', 500_000);
            $feePerReward = $minAda + $maxTxFee;
            $explorerBase = config('services.cardano.explorer_url');

            $certEnabled  = $courseHistory->effectiveCertificateEnabled();
            $tokenEnabled = $courseHistory->effectiveTokenRewardEnabled();

            $certData  = null;
            $tokenData = null;

            if ($certEnabled) {
                $certStatus   = $courseHistory->certificate_status ?? 'not_eligible';
                $certTxHash   = $courseHistory->certificate_tx_hash;
                $certExplorer = ($certTxHash && $explorerBase)
                    ? $explorerBase . '/transaction/' . $certTxHash
                    : null;

                $certData = [
                    'status'       => $certStatus,
                    'tx_hash'      => $certTxHash,
                    'explorer_url' => $certExplorer,
                    'minted_at'    => $courseHistory->certificate_minted_at,
                    'fee_lovelace' => $feePerReward,
                ];
            }

            if ($tokenEnabled) {
                $tokenStatus  = $courseHistory->token_reward_status ?? 'not_eligible';
                $tokenTxHash  = $courseHistory->token_reward_tx_hash;
                $tokenExplorer = ($tokenTxHash && $explorerBase)
                    ? $explorerBase . '/transaction/' . $tokenTxHash
                    : null;

                $tokenData = [
                    'status'       => $tokenStatus,
                    'amount'       => $courseHistory->effectiveTokenRewardAmount(),
                    'tx_hash'      => $tokenTxHash,
                    'explorer_url' => $tokenExplorer,
                    'minted_at'    => $courseHistory->token_reward_minted_at,
                    'fee_lovelace' => $feePerReward,
                ];
            }

            $totalFee = ($certData ? $feePerReward : 0) + ($tokenData ? $feePerReward : 0);

            return [
                'certificate'        => $certData,
                'token'              => $tokenData,
                'total_fee_lovelace' => $totalFee,
            ];

        } catch (Exception $e) {
            Log::error('Failed to get self-mint eligibility', [
                'course_id'   => $courseId,
                'student_id'  => $studentId,
                'schedule_id' => $scheduleId,
                'error'       => $e->getMessage(),
            ]);

            return null;
        }
    }
}
