<?php

namespace App\Services\Portal;

use App\Models\CourseHistory;
use App\Models\StripePayment;
use Illuminate\Pagination\LengthAwarePaginator;

class PurchaseHistoryService
{
    const PER_PAGE = 15;

    public function getPurchaseHistory(int $userId, int $page, string $explorerUrl): LengthAwarePaginator
    {
        $adaPurchases = $this->getAdaPurchases($userId, $explorerUrl);
        $stripePurchases = $this->getStripePurchases($userId);

        $merged = $adaPurchases->concat($stripePurchases)
            ->sortByDesc('date')
            ->values();

        $total = $merged->count();
        $offset = ($page - 1) * self::PER_PAGE;
        $items = $merged->slice($offset, self::PER_PAGE)->values();

        return new LengthAwarePaginator($items, $total, self::PER_PAGE, $page, [
            'path' => '/mypage/purchase-history',
        ]);
    }

    private function getAdaPurchases(int $userId, string $explorerUrl): \Illuminate\Support\Collection
    {
        return CourseHistory::with('course:id,title')
            ->where('user_id', $userId)
            ->whereNotNull('payment_status')
            ->orderByDesc('payment_submitted_at')
            ->get()
            ->map(function (CourseHistory $h) use ($explorerUrl) {
                $txHash = $h->payment_tx_hash;

                return [
                    'id'           => 'ada-' . $h->id,
                    'type'         => 'ADA',
                    'course_name'  => $h->course->title ?? '—',
                    'course_id'    => $h->course_id,
                    'amount'       => $h->payment_ada_amount !== null
                        ? number_format((float) $h->payment_ada_amount, 6) . ' ADA'
                        : '—',
                    'date'         => $h->getRawOriginal('payment_submitted_at')
                        ?? $h->getRawOriginal('created_at'),
                    'status'       => $h->payment_status,
                    'tx_hash'      => $txHash,
                    'receipt_url'  => null,
                    'explorer_url' => $txHash ? $explorerUrl . '/tx/' . $txHash : null,
                ];
            });
    }

    private function getStripePurchases(int $userId): \Illuminate\Support\Collection
    {
        return StripePayment::with('course:id,title')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (StripePayment $p) {
                return [
                    'id'           => 'stripe-' . $p->id,
                    'type'         => 'CC',
                    'course_name'  => $p->course->title ?? '—',
                    'course_id'    => $p->course_id,
                    'amount'       => $p->currency === 'jpy'
                        ? '¥' . number_format($p->amount)
                        : '$' . number_format($p->amount / 100, 2),
                    'date'         => $p->getRawOriginal('created_at'),
                    'status'       => $p->status,
                    'tx_hash'      => null,
                    'receipt_url'  => $p->receipt_url,
                    'explorer_url' => null,
                ];
            });
    }
}
