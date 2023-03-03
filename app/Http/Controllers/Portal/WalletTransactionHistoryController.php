<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchClassRequest;
use App\Models\Country;
use App\Models\WalletTransactionHistory;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseHistoryRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletTransactionHistoryController extends Controller
{
    public function index(Request $request)
    {
        // dd(@$request['page']);
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
