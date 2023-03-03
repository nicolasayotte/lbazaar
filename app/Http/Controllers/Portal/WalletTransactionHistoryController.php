<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletTransactionHistoryController extends Controller
{
    public function index(Request $request)
    {
        $walletTransactionHistory = auth()->user()->userWallet()->first()->userWalletTransactions()->paginate(10);
        return Inertia::render('Portal/MyPage/WalletHistory/Index', [
            'page'           => @$request['page'] ?? 1,
            'wallet_history' => $walletTransactionHistory,
            'title'          => getTranslation('texts.mypage').' | '.getTranslation('texts.wallet_history')
        ])->withViewData([
            'title'          => getTranslation('texts.mypage').' | '.getTranslation('texts.wallet_history')
        ]);
    }
}
