<?php

namespace App\Services\API;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\User;
use App\Models\UserExam;
use App\Models\UserWallet;
use App\Models\Nft;
use App\Models\NftTransactions;
use Exception;
use Illuminate\Support\Facades\Log;

class CertificateService
{
    private const DEFAULT_ADMIN_USER_ID = 1;

    /**
     * Mint and airdrop certificate NFT to a student
     * 
     * @param Course $course
     * @param User $student
     * @param int|null $scheduleId
     * @return array
     */
    public function mintAndAirdropCertificate(Course $course, User $student, $scheduleId = null)
    {
        try {
            // Determine wallet address for airdrop
            $walletAddress = $this->getStudentWalletAddress($student);
            
            // Create certificate metadata
            $certificateData = $this->createCertificateMetadata($course, $student);
            
            // Mint the certificate NFT
            $mintResult = $this->mintCertificateNFT($certificateData, $walletAddress);
            
            if (!$mintResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Failed to mint certificate NFT: ' . $mintResult['message'],
                    'wallet_address' => $walletAddress
                ];
            }

            // Record the NFT transaction
            $this->recordNftTransaction($student->id, $mintResult, $certificateData);

            // Send notification email (optional)
            $this->sendCertificateNotification($student, $course, $mintResult);

            return [
                'success' => true,
                'message' => 'Certificate minted and airdropped successfully',
                'transaction_id' => $mintResult['transaction_id'],
                'wallet_address' => $walletAddress,
                'nft_metadata' => $certificateData
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
     * @return array
     */
    protected function createCertificateMetadata(Course $course, User $student)
    {
        $timestamp = now();
        $serialNumber = $timestamp->timestamp;

        return [
            'name' => 'Certificate of Completion',
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
     * @return array
     */
    protected function mintCertificateNFT($certificateData, $walletAddress)
    {
        try {
            $metadataJson = json_encode($certificateData);

            if ($metadataJson === false) {
                throw new Exception('Failed to encode certificate metadata');
            }

            // Create NFT name and metadata
            $nftName = 'Certificate-' . $certificateData['course_id'] . '-' . $certificateData['student_id'];
            $serialNum = $certificateData['serial_number'];
            
            $certificateNft = Nft::where('name', 'Certificate')->first();
            if (!$certificateNft) {
                throw new Exception('Certificate NFT template not found in database');
            }

            $mph = $certificateNft->mph;
            $imageUrl = $certificateNft->image_url;

            $buildCommand = $this->buildWeb3Command('run/build-certificate-tx.mjs', [
                $walletAddress,
                $nftName,
                $serialNum,
                $mph,
                $imageUrl,
                $metadataJson
            ]);

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
                        'success' => true,
                        'transaction_id' => $submitResponseJSON['txId'],
                        'nft_name' => $nftName,
                        'serial_number' => $serialNum,
                        'mph' => $mph
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
     * Build a command for executing a Node script in the web3 directory.
     *
     * @param string $scriptRelativePath
     * @param array $arguments
     * @return string
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
     * Execute a shell command and return its output.
     *
     * @param string $command
     * @param int $timeout Maximum execution time in seconds (default: 30)
     * @return string
     */
    protected function runCommand(string $command, int $timeout = 30): string
    {
        $output = [];
        $returnVar = null;

        // Add timeout to the command using 'timeout' utility
        $timedCommand = sprintf('timeout %d %s', $timeout, $command);
        
        exec($timedCommand, $output, $returnVar);

        if ($returnVar === 124) { // timeout exit code
            Log::error('Command execution timed out', [
                'command' => $command,
                'timeout' => $timeout,
            ]);
            throw new Exception("Command execution timed out after {$timeout} seconds");
        }

        if ($returnVar !== 0) {
            Log::error('Command execution failed', [
                'command' => $command,
                'exit_code' => $returnVar,
            ]);
        }

        return trim(implode(PHP_EOL, $output));
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

        // Set certificate_minted_at if status is 'minted'
        if ($status === 'minted') {
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
                $network = config('app.cardano_network', 'preprod');
                $explorerUrl = $network === 'mainnet'
                    ? "https://cardanoscan.io/transaction/{$certificateTransaction->tx_id}"
                    : "https://preprod.cardanoscan.io/transaction/{$certificateTransaction->tx_id}";

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
}
