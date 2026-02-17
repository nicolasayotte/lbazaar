<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\CourseHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CertificateController extends Controller
{
    /**
     * Display all certificates earned by the authenticated student
     */
    public function index()
    {
        $userId = Auth::id();

        $certificates = CourseHistory::where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->where('is_cancelled', false)
            ->whereHas('course', function($q) {
                $q->where('certificate_enabled', true);
            })
            ->with(['course.professor', 'possibleCertificateTransactions'])
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
            });

        return Inertia::render('Portal/MyPage/Badges/Index', [
            'certificates' => $certificates,
            'title' => getTranslation('texts.mypage') . ' | ' . getTranslation('texts.certificates'),
            'hasButtons' => true
        ])->withViewData([
            'title' => getTranslation('texts.mypage') . ' | ' . getTranslation('texts.certificates')
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
                'message' => 'Certificate not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'certificate_status' => $history->certificate_status ?? 'not_eligible',
                'certificate_tx_hash' => $history->certificate_tx_hash,
                'certificate_minted_at' => $history->certificate_minted_at,
                'certificate_explorer_url' => $history->certificate_explorer_url,
            ]
        ]);
    }
}
