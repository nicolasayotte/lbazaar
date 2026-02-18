<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\API\CoursePurchaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CoursePaymentController extends Controller
{
    protected $purchaseService;

    public function __construct(CoursePurchaseService $purchaseService)
    {
        $this->purchaseService = $purchaseService;
    }

    /**
     * Handle Blockfrost webhook for purchase confirmation
     * Following pattern from UserWalletController::feed
     */
    public function handlePurchaseWebhook(Request $request)
    {
        try {
            $headers = $request->header();

            // Get blockfrost api signature
            $apiSignature = $headers['blockfrost-signature'][0] ?? null;

            if (!$apiSignature) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing Blockfrost signature'
                ], 400);
            }

            $body = $request->all();
            $webhook = 'purchase';
            $web3Dir = base_path('web3');
            $logPath = storage_path('logs/web3.log');
            $cmd = '(cd '.escapeshellarg($web3Dir).';node ./run/blockfrost-verify.mjs '
            .escapeshellarg(json_encode($apiSignature)).' '
            .escapeshellarg(json_encode($body)).' '
            .escapeshellarg($webhook).') 2>> '.escapeshellarg($logPath);

            if (app()->environment('testing')) {
                throw new \RuntimeException(
                    'exec() in CoursePaymentController must be mocked in tests. Mock the route or service layer.'
                );
            }

            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if (!$responseJSON || $responseJSON->status != 200) {
                Log::warning('Purchase webhook signature verification failed', [
                    'body' => $body
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Webhook signature verification failed'
                ], 401);
            }

            // Extract transaction ID
            $txId = $body['payload'][0]['tx']['hash'] ?? null;

            if (!$txId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction ID not found in webhook payload'
                ], 400);
            }

            // Confirm purchase
            $result = $this->purchaseService->confirmPurchaseTransaction($txId);

            return response()->json($result, $result['success'] ? 200 : 400);

        } catch (\Exception $e) {
            Log::error('Purchase webhook handling failed', [
                'error' => $e->getMessage(),
                'body' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
