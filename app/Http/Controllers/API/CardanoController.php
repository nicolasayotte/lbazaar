<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\API\CardanoNetworkService;

class CardanoController extends Controller
{
    public function __construct(protected CardanoNetworkService $networkService) {}

    public function networkStatus(): \Illuminate\Http\JsonResponse
    {
        $result = $this->networkService->getNetworkStatus();
        return response()->json([
            'status' => $result['status'],
            'lastBlockTime' => $result['lastBlockTime'],
        ]);
    }
}
