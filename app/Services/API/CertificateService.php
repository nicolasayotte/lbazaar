<?php

namespace App\Services\API;

use App\Models\Course;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\Nft;
use App\Models\NftTransactions;
use Exception;
use Illuminate\Support\Facades\Log;

class CertificateService
{
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
        
        // If student has a linked wallet with verified stake key, use it
        if ($userWallet && $userWallet->address) {
            return $userWallet->address;
        }
        
        // If no linked wallet, use the user's custodial_address if available
        if ($student->custodial_address) {
            return $student->custodial_address;
        }
        // Otherwise fail
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
            // Create NFT name and metadata
            $nftName = 'Certificate-' . $certificateData['course_id'] . '-' . $certificateData['student_id'];
            $serialNum = $certificateData['serial_number'];
            
            // Get certificate NFT template (you may need to create this in the database)
            $certificateNft = Nft::where('name', 'Certificate')->first();
            if (!$certificateNft) {
                throw new Exception('Certificate NFT template not found in database');
            }

            $mph = $certificateNft->mph;
            $imageUrl = $certificateNft->image_url;

            // Build the minting transaction
            $cmd = '(cd ../web3/; node ./run/build-certificate-tx.mjs ' 
                . escapeshellarg($walletAddress) . ' '
                . escapeshellarg($nftName) . ' '
                . escapeshellarg($serialNum) . ' '
                . escapeshellarg($mph) . ' '
                . escapeshellarg($imageUrl) . ' '
                . escapeshellarg(json_encode($certificateData)) . ') 2>> ../storage/logs/web3.log';

            $response = exec($cmd);
            $responseJSON = json_decode($response, true);

            if ($responseJSON && $responseJSON['status'] === 200) {
                // Submit the transaction
                $submitCmd = '(cd ../web3/; node ./run/submit-certificate-tx.mjs '
                    . escapeshellarg($responseJSON['cborTx']) . ') 2>> ../storage/logs/web3.log';

                $submitResponse = exec($submitCmd);
                $submitResponseJSON = json_decode($submitResponse, true);

                if ($submitResponseJSON && $submitResponseJSON['status'] === 200) {
                    return [
                        'success' => true,
                        'transaction_id' => $submitResponseJSON['txId'],
                        'nft_name' => $nftName,
                        'serial_number' => $serialNum,
                        'mph' => $mph
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Failed to submit minting transaction: ' . ($submitResponseJSON['error'] ?? 'Unknown error')
                    ];
                }
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to build minting transaction: ' . ($responseJSON['error'] ?? 'Unknown error')
                ];
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'NFT minting error: ' . $e->getMessage()
            ];
        }
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
}
