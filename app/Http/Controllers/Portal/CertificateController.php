<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\CourseHistory;
use App\Services\API\CertificateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function __construct(
        private readonly CertificateService $certificateService
    ) {}

    /**
     * Display all rewards earned by the authenticated student
     */
    public function index()
    {
        $result = $this->certificateService->getStudentRewards(Auth::id());

        $rewards = $result['success'] ? ($result['data']['rewards'] ?? []) : [];

        return Inertia::render('Portal/MyPage/Badges/Index', [
            'rewards'    => $rewards,
            'title'      => getTranslation('texts.mypage') . ' | ' . getTranslation('texts.certificates'),
            'hasButtons' => true,
        ])->withViewData([
            'title' => getTranslation('texts.mypage') . ' | ' . getTranslation('texts.certificates'),
        ]);
    }

    /**
     * Get certificate status for a specific course history (AJAX endpoint)
     */
    public function getStatus(Request $request, $courseHistoryId)
    {
        $userId = Auth::id();

        $history = CourseHistory::where('id', $courseHistoryId)
            ->where('user_id', $userId)
            ->with(['course', 'possibleCertificateTransactions'])
            ->first();

        if (!$history) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'certificate_status'       => $history->certificate_status ?? 'not_eligible',
                'certificate_tx_hash'      => $history->certificate_tx_hash,
                'certificate_minted_at'    => $history->certificate_minted_at,
                'certificate_explorer_url' => $history->certificate_explorer_url,
            ],
        ]);
    }
}
