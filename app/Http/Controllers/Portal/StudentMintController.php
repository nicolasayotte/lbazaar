<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentSelfMintRequest;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\Nft;
use App\Services\API\CertificateService;
use App\Services\API\TokenRewardService;
use App\Traits\Web3CommandTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StudentMintController extends Controller
{
    use Web3CommandTrait;

    public function __construct(
        protected CertificateService $certificateService,
        protected TokenRewardService $tokenRewardService
    ) {
        $this->middleware('auth');
    }

    /**
     * Self-mint a certificate or token reward for an authenticated student.
     *
     * POST /classes/{course_id}/attend/{schedule_id}/self-mint
     */
    public function selfMint(StudentSelfMintRequest $request, int $course_id, int $schedule_id)
    {
        $student = auth()->user();

        // Verify student has a completed CourseHistory for this course/schedule
        $courseHistory = CourseHistory::where('user_id', $student->id)
            ->where('course_id', $course_id)
            ->where('course_schedule_id', $schedule_id)
            ->whereNotNull('completed_at')
            ->first();

        if (!$courseHistory) {
            return response()->json([
                'success' => false,
                'message' => 'Course not completed or enrollment not found.',
            ], 404);
        }

        $type = $request->input('type');

        // CIP-30 flow: tx already submitted on-chain, just record the result
        if ($request->boolean('via_cip30')) {
            $txHash = $request->input('tx_hash');

            if ($type === 'certificate') {
                $this->certificateService->updateCertificateStatus(
                    $course_id, $student->id, 'self_minted', $schedule_id, $txHash
                );
            } else {
                $this->tokenRewardService->updateTokenRewardStatus(
                    $course_id, $student->id, 'minted', $schedule_id, $txHash
                );
            }

            $explorerBase = config('services.cardano.explorer_url');
            $explorerUrl  = ($txHash && $explorerBase) ? $explorerBase . '/tx/' . $txHash : null;

            return response()->json([
                'success'      => true,
                'message'      => ucfirst($type) . ' minted successfully.',
                'tx_hash'      => $txHash,
                'explorer_url' => $explorerUrl,
            ]);
        }

        if ($type === 'certificate') {
            return $this->handleCertificateMint($courseHistory, $course_id, $schedule_id, $student);
        }

        return $this->handleTokenMint($courseHistory, $course_id, $schedule_id, $student);
    }

    /**
     * Handle certificate self-mint.
     */
    protected function handleCertificateMint(
        CourseHistory $courseHistory,
        int $courseId,
        int $scheduleId,
        $student
    ) {
        // Guard: certificate must be enabled via enrollment-time snapshot
        if (!$courseHistory->effectiveCertificateEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate is not enabled for this enrollment.',
            ], 403);
        }

        // Guard: certificate must not already be minted or self_minted
        $certStatus = $courseHistory->certificate_status ?? null;
        if (in_array($certStatus, ['minted', 'self_minted'], true)) {
            return response()->json([
                'success'        => false,
                'message'        => 'Certificate has already been minted.',
                'already_minted' => true,
            ], 409);
        }

        $course = Course::findOrFail($courseId);

        $result = $this->certificateService->mintAndAirdropCertificate(
            $course,
            $student,
            $scheduleId,
            $courseHistory
        );

        if (!$result['success']) {
            Log::warning('Student self-mint certificate failed', [
                'course_id'   => $courseId,
                'student_id'  => $student->id,
                'schedule_id' => $scheduleId,
                'message'     => $result['message'],
            ]);

            $courseHistory->certificate_status = 'failed';
            $courseHistory->save();

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 500);
        }

        $explorerBase = config('services.cardano.explorer_url');
        $txHash       = $result['transaction_id'] ?? null;
        $explorerUrl  = ($txHash && $explorerBase) ? $explorerBase . '/tx/' . $txHash : null;

        return response()->json([
            'success'      => true,
            'message'      => 'Certificate minted successfully.',
            'tx_hash'      => $txHash,
            'explorer_url' => $explorerUrl,
        ]);
    }

    /**
     * Handle token reward self-mint.
     */
    protected function handleTokenMint(
        CourseHistory $courseHistory,
        int $courseId,
        int $scheduleId,
        $student
    ) {
        // Guard: token reward must be enabled via enrollment-time snapshot
        if (!$courseHistory->effectiveTokenRewardEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Token reward is not enabled for this enrollment.',
            ], 403);
        }

        // Guard: token reward must not already be minted
        $tokenStatus = $courseHistory->token_reward_status ?? null;
        if ($tokenStatus === 'minted') {
            return response()->json([
                'success'        => false,
                'message'        => 'Token reward has already been minted.',
                'already_minted' => true,
            ], 409);
        }

        $course = Course::findOrFail($courseId);

        $result = $this->tokenRewardService->mintAndAirdropTokenReward(
            $course,
            $student,
            $scheduleId
        );

        if (!$result['success']) {
            Log::warning('Student self-mint token reward failed', [
                'course_id'   => $courseId,
                'student_id'  => $student->id,
                'schedule_id' => $scheduleId,
                'message'     => $result['message'],
            ]);

            $courseHistory->token_reward_status = 'failed';
            $courseHistory->save();

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 500);
        }

        $explorerBase = config('services.cardano.explorer_url');
        $txHash       = $result['transaction_id'] ?? null;
        $explorerUrl  = ($txHash && $explorerBase) ? $explorerBase . '/tx/' . $txHash : null;

        return response()->json([
            'success'      => true,
            'message'      => 'Token reward minted successfully.',
            'tx_hash'      => $txHash,
            'explorer_url' => $explorerUrl,
        ]);
    }

    /**
     * Build a mint transaction for the student to co-sign via CIP-30.
     *
     * The backend builds the tx using the student's UTXOs (from their wallet),
     * signs with the owner key (required by the minting policy), and returns
     * the partially-signed CBOR. The student then signs with their wallet
     * and submits on-chain.
     *
     * POST /wallet/build-mint-tx
     */
    public function buildMintTx(Request $request)
    {
        $request->validate([
            'type'        => 'required|in:certificate,token',
            'course_id'   => 'required|integer',
            'schedule_id' => 'required|integer',
            'changeAddr'  => ['required', 'regex:/^[0-9a-fA-F]+$/'],
            'utxos'       => 'required|array|min:1',
            'utxos.*'     => 'required|string|regex:/^[0-9a-fA-F]+$/',
        ]);

        $student = auth()->user();
        $courseId   = $request->input('course_id');
        $scheduleId = $request->input('schedule_id');
        $type       = $request->input('type');

        // Verify completed enrollment
        $courseHistory = CourseHistory::where('user_id', $student->id)
            ->where('course_id', $courseId)
            ->where('course_schedule_id', $scheduleId)
            ->whereNotNull('completed_at')
            ->first();

        if (!$courseHistory) {
            return response()->json([
                'success' => false,
                'message' => 'Course not completed or enrollment not found.',
            ], 404);
        }

        $course     = Course::findOrFail($courseId);
        $changeAddr = $request->input('changeAddr');

        // Write UTXOs to a temp file — CIP-30 CBOR hex strings can be very long
        // and may break shell argument limits or escaping
        $utxoFile = tempnam(sys_get_temp_dir(), 'utxo_');
        file_put_contents($utxoFile, json_encode($request->input('utxos')));

        try {
            if ($type === 'certificate') {
                return $this->buildCertificateMintTx($courseHistory, $course, $student, $changeAddr, $utxoFile);
            }
            return $this->buildTokenMintTx($courseHistory, $course, $student, $changeAddr, $utxoFile);
        } finally {
            @unlink($utxoFile);
        }
    }

    protected function buildCertificateMintTx(
        CourseHistory $courseHistory,
        Course $course,
        $student,
        string $changeAddr,
        string $utxoFile
    ) {
        if (!$courseHistory->effectiveCertificateEnabled()) {
            return response()->json(['success' => false, 'message' => 'Certificate not enabled.'], 403);
        }

        $certStatus = $courseHistory->certificate_status ?? null;
        if (in_array($certStatus, ['minted', 'self_minted'], true)) {
            return response()->json(['success' => false, 'message' => 'Already minted.'], 409);
        }

        $nftName   = 'Cert-' . $course->id . '-' . $student->id;
        $serialNum = (string) now()->timestamp;
        $imageUrl  = Nft::where('name', 'Certificate')->first()?->image_url ?? '';

        $metadata = $this->certificateService->createCertificateMetadata(
            $course,
            $student,
            $courseHistory->effectiveCertificateName(),
            $courseHistory->effectiveCertificateDescription()
        );

        $cmd = $this->buildWeb3Command('run/build-student-certificate-tx.mjs', [
            $changeAddr,
            $utxoFile,
            $nftName,
            $serialNum,
            $imageUrl,
            json_encode($metadata),
        ]);

        $response = $this->runCommand($cmd, 60);
        $json     = json_decode($response, true);

        if (!is_array($json) || ($json['status'] ?? 0) !== 200) {
            $error = $json['error'] ?? 'Unknown error';
            Log::warning('build-mint-tx certificate failed', ['error' => $error, 'raw_response' => substr($response ?? '', 0, 500)]);
            return response()->json(['success' => false, 'message' => 'Transaction build failed. Please try again.'], 500);
        }

        // Don't mark pending here — status only changes after student signs + submits
        return response()->json([
            'success'   => true,
            'cborTx'    => $json['cborTx'],
            'nftName'   => $json['nftName'],
            'serialNum' => $json['serialNum'],
            'mph'       => $json['mph'],
        ]);
    }

    protected function buildTokenMintTx(
        CourseHistory $courseHistory,
        Course $course,
        $student,
        string $changeAddr,
        string $utxoFile
    ) {
        if (!$courseHistory->effectiveTokenRewardEnabled()) {
            return response()->json(['success' => false, 'message' => 'Token reward not enabled.'], 403);
        }

        if (($courseHistory->token_reward_status ?? null) === 'minted') {
            return response()->json(['success' => false, 'message' => 'Already minted.'], 409);
        }

        $tokenName = 'Token-' . $course->id;
        $quantity  = (string) $courseHistory->effectiveTokenRewardAmount();

        $cmd = $this->buildWeb3Command('run/build-student-token-tx.mjs', [
            $changeAddr,
            $utxoFile,
            $tokenName,
            $quantity,
        ]);

        $response = $this->runCommand($cmd, 60);
        $json     = json_decode($response, true);

        if (!is_array($json) || ($json['status'] ?? 0) !== 200) {
            $error = $json['error'] ?? 'Unknown error';
            Log::warning('build-mint-tx token failed', ['error' => $error]);
            return response()->json(['success' => false, 'message' => 'Transaction build failed. Please try again.'], 500);
        }

        // Don't mark pending here — status only changes after student signs + submits
        return response()->json([
            'success'   => true,
            'cborTx'    => $json['cborTx'],
            'tokenName' => $json['tokenName'],
            'quantity'  => $json['quantity'],
            'mph'       => $json['mph'],
        ]);
    }

    /**
     * Submit a student-signed mint transaction.
     *
     * The frontend calls signTx() (CIP-30) which returns a witness set.
     * This endpoint merges the student's witness set with the owner-signed
     * transaction and submits to the blockchain via Blockfrost.
     *
     * POST /wallet/submit-mint-tx
     */
    public function submitMintTx(Request $request)
    {
        $request->validate([
            'type'        => 'required|in:certificate,token',
            'course_id'   => 'required|integer',
            'schedule_id' => 'required|integer',
            'cborSig'     => ['required', 'string', 'regex:/^[0-9a-fA-F]+$/'],
            'cborTx'      => ['required', 'string', 'regex:/^[0-9a-fA-F]+$/'],
        ]);

        $student    = auth()->user();
        $courseId    = $request->input('course_id');
        $scheduleId = $request->input('schedule_id');
        $type       = $request->input('type');

        // Verify completed enrollment
        $courseHistory = CourseHistory::where('user_id', $student->id)
            ->where('course_id', $courseId)
            ->where('course_schedule_id', $scheduleId)
            ->whereNotNull('completed_at')
            ->first();

        if (!$courseHistory) {
            return response()->json([
                'success' => false,
                'message' => 'Course not completed or enrollment not found.',
            ], 404);
        }

        // Merge student witness set with owner-signed tx and submit
        $cmd = $this->buildWeb3Command('run/submit-signed-tx.mjs', [
            $request->input('cborSig'),
            $request->input('cborTx'),
        ]);

        try {
            $response = $this->runCommand($cmd, 60);
        } catch (\Exception $e) {
            Log::error('submit-mint-tx failed', [
                'course_id'  => $courseId,
                'student_id' => $student->id,
                'error'      => $e->getMessage(),
            ]);

            if ($type === 'certificate') {
                $courseHistory->certificate_status = 'failed';
            } else {
                $courseHistory->token_reward_status = 'failed';
            }
            $courseHistory->save();

            return response()->json(['success' => false, 'message' => 'Mint transaction submission failed. Please try again.'], 500);
        }

        $json = json_decode($response, true);

        if (!is_array($json) || ($json['status'] ?? 0) !== 200) {
            $error = $json['error'] ?? 'Submission failed';
            Log::warning('submit-mint-tx rejected', ['error' => $error]);

            if ($type === 'certificate') {
                $courseHistory->certificate_status = 'failed';
            } else {
                $courseHistory->token_reward_status = 'failed';
            }
            $courseHistory->save();

            return response()->json(['success' => false, 'message' => 'Mint transaction submission failed. Please try again.'], 500);
        }

        $txHash = $json['txId'];

        // Record the on-chain result
        if ($type === 'certificate') {
            $this->certificateService->updateCertificateStatus(
                $courseId, $student->id, 'self_minted', $scheduleId, $txHash
            );
        } else {
            $this->tokenRewardService->updateTokenRewardStatus(
                $courseId, $student->id, 'minted', $scheduleId, $txHash
            );
        }

        $explorerBase = config('services.cardano.explorer_url');
        $explorerUrl  = ($txHash && $explorerBase) ? $explorerBase . '/tx/' . $txHash : null;

        return response()->json([
            'success'      => true,
            'message'      => ucfirst($type) . ' minted successfully.',
            'tx_hash'      => $txHash,
            'explorer_url' => $explorerUrl,
        ]);
    }
}
