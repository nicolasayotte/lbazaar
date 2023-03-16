<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserBadgeController extends Controller
{
    public function index(Request $request)
    {
        $userBadges = auth()->user()->badges()->paginate(10);

        return Inertia::render('Portal/MyPage/Badges/Index', [
            'page'           => @$request['page'] ?? 1,
            'user_badges'    => $userBadges,
            'title'          => getTranslation('texts.mypage').' | '.getTranslation('texts.badges'),
            'hasButtons'     => true
        ])->withViewData([
            'title'          => getTranslation('texts.mypage').' | '.getTranslation('texts.badges')
        ]);
    }
}
