<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CourseHistory;
use App\Services\API\CoursePurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PurchaseStatusController extends Controller
{
    public function __construct(protected CoursePurchaseService $purchaseService) {}

    public function show(string $txHash): JsonResponse
    {
        $courseHistory = CourseHistory::where('payment_tx_hash', $txHash)
            ->where('user_id', Auth::id())
            ->first();

        if (!$courseHistory) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        $required = (int) config('services.cardano.required_confirmations', 10);

        if ($courseHistory->payment_status === 'confirmed') {
            return response()->json([
                'success' => true,
                'data' => ['status' => 'confirmed', 'confirmations' => $required, 'required' => $required],
            ]);
        }

        if ($courseHistory->payment_status === 'failed') {
            return response()->json([
                'success' => true,
                'data' => ['status' => 'failed', 'confirmations' => 0, 'required' => $required],
            ]);
        }

        $statusData = $this->purchaseService->getTxStatus($txHash);

        if ($statusData['status'] === 'confirmed') {
            $this->purchaseService->confirmPurchaseTransaction($txHash);
        }

        return response()->json(['success' => true, 'data' => $statusData]);
    }
}
