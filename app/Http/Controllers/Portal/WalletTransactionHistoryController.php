<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletTransactionHistoryController extends Controller
{
    public function index(Request $request)
    {
        $wallet = auth()->user()->userWallet()->first();
        $walletTransactionHistory = $wallet
            ? $wallet->userWalletTransactions()->orderBy('id', 'DESC')->paginate(10)
            : new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        return Inertia::render('Portal/MyPage/WalletHistory/Index', [
            'page'           => @$request['page'] ?? 1,
            'wallet_history' => $walletTransactionHistory,
            'title'          => getTranslation('texts.mypage').' | '.getTranslation('texts.wallet_history')
        ])->withViewData([
            'title'          => getTranslation('texts.mypage').' | '.getTranslation('texts.wallet_history')
        ]);
    }
}
