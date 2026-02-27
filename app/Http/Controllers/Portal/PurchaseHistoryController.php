<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\Portal\PurchaseHistoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PurchaseHistoryController extends Controller
{
    public function __construct(private PurchaseHistoryService $purchaseHistoryService) {}

    public function index(Request $request): \Inertia\Response
    {
        $page = max(1, (int) $request->query('page', 1));
        $explorerUrl = config('services.cardano.explorer_url');

        $purchases = $this->purchaseHistoryService->getPurchaseHistory(
            Auth::id(),
            $page,
            $explorerUrl
        );

        return Inertia::render('Portal/MyPage/PurchaseHistory/Index', [
            'purchases'             => $purchases,
            'explorerUrl'           => $explorerUrl,
            'requiredConfirmations' => (int) config('services.cardano.required_confirmations', 10),
            'title'                 => getTranslation('texts.mypage') . ' | ' . getTranslation('texts.purchase_history'),
        ])->withViewData([
            'title' => getTranslation('texts.mypage') . ' | ' . getTranslation('texts.purchase_history'),
        ]);
    }
}
