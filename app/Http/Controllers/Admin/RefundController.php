<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseHistory;
use App\Models\StripePayment;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class RefundController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->input('keyword', '');
        $paymentMethod = $request->input('payment_method', '');
        $page = max(1, (int) $request->input('page', 1));
        $perPage = 10;

        $stripeRows = collect();
        if ($paymentMethod !== 'ada') {
            $query = StripePayment::with(['user', 'course'])
                ->where('status', 'succeeded')
                ->when($keyword, function ($q) use ($keyword) {
                    $q->where(function ($q2) use ($keyword) {
                        $q2->whereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$keyword}%")
                            ->orWhere('last_name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%"))
                          ->orWhereHas('course', fn ($c) => $c->where('title', 'like', "%{$keyword}%"));
                    });
                });

            $stripeRows = $query->get()->map(fn ($p) => [
                'type'              => 'stripe',
                'stripe_payment_id' => $p->stripe_payment_intent_id,
                'course_history_id' => null,
                'student_name'      => trim(($p->user->first_name ?? '') . ' ' . ($p->user->last_name ?? '')),
                'student_email'     => $p->user->email ?? '',
                'course_name'       => $p->course->title ?? '',
                'amount'            => '¥' . number_format($p->amount),
                'payment_date'      => $p->created_at?->format('Y-m-d'),
                'has_rewards'       => $p->courseHistory && (
                    in_array($p->courseHistory->certificate_status, ['minted', 'self_minted'])
                    || $p->courseHistory->token_reward_minted_at !== null
                ),
            ]);
        }

        $adaRows = collect();
        if ($paymentMethod !== 'stripe') {
            $query = CourseHistory::with(['user', 'course'])
                ->whereNotNull('payment_status')
                ->where('payment_status', 'confirmed')
                ->where('is_cancelled', false)
                ->when($keyword, function ($q) use ($keyword) {
                    $q->where(function ($q2) use ($keyword) {
                        $q2->whereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$keyword}%")
                            ->orWhere('last_name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%"))
                          ->orWhereHas('course', fn ($c) => $c->where('title', 'like', "%{$keyword}%"));
                    });
                });

            $adaRows = $query->get()->map(fn ($h) => [
                'type'              => 'ada',
                'stripe_payment_id' => null,
                'course_history_id' => $h->id,
                'student_name'      => trim(($h->user->first_name ?? '') . ' ' . ($h->user->last_name ?? '')),
                'student_email'     => $h->user->email ?? '',
                'course_name'       => $h->course->title ?? '',
                'amount'            => number_format((float) $h->payment_ada_amount, 2) . ' ADA',
                'payment_date'      => $h->created_at?->format('Y-m-d') ?? '',
                'has_rewards'       => in_array($h->certificate_status, ['minted', 'self_minted'])
                    || $h->token_reward_minted_at !== null,
            ]);
        }

        $allRows = $stripeRows->merge($adaRows)->sortByDesc('payment_date')->values();
        $pageItems = $allRows->slice(($page - 1) * $perPage, $perPage)->values();

        $purchases = new LengthAwarePaginator(
            $pageItems,
            $allRows->count(),
            $perPage,
            $page,
            ['path' => route('admin.refunds.index')]
        );

        return Inertia::render('Admin/Refunds/Index', [
            'purchases'      => $purchases,
            'keyword'        => $keyword,
            'payment_method' => $paymentMethod,
        ])->withViewData([
            'title' => getTranslation('title.refunds'),
        ]);
    }
}
