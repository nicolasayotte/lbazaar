<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletTransactionHistoryController extends Controller
{
    public function index(Request $request)
    {
        $walletTransactionHistory = auth()->user()->userWallet()->first()->userWalletTransactions()->orderBy('id', 'DESC')->paginate(10);
        return Inertia::render('Admin/WalletHistory/Index', [
            'page'           => @$request['page'] ?? 1,
            'wallet_history' => $walletTransactionHistory,
            'title'          => getTranslation('texts.wallet_history')
        ])->withViewData([
            'title'          => getTranslation('texts.wallet_history')
        ]);
    }
}
