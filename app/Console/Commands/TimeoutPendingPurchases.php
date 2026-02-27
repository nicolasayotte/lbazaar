<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CourseHistory;
use App\Services\API\CoursePurchaseService;

class TimeoutPendingPurchases extends Command
{
    protected $signature = 'purchases:timeout {--dry-run : Report without updating}';
    protected $description = 'Mark stale pending ADA purchases as failed';

    public function handle(CoursePurchaseService $purchaseService): int
    {
        $timeoutMinutes = (int) config('services.cardano.payment_timeout_minutes', 30);
        $required = (int) config('services.cardano.required_confirmations', 10);

        if ($timeoutMinutes <= 0) {
            $this->warn('ADA_PAYMENT_TIMEOUT_MINUTES is set to 0 or invalid. Defaulting to 30 minutes.');
            $timeoutMinutes = 30;
        }

        $cutoff = now()->subMinutes($timeoutMinutes);
        $stale = CourseHistory::where('payment_status', 'pending')
            ->where('payment_submitted_at', '<', $cutoff)
            ->get();

        if ($stale->isEmpty()) {
            $this->info('No stale pending purchases found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$stale->count()} stale pending purchase(s).");

        foreach ($stale as $history) {
            try {
                $txHash = $history->payment_tx_hash;
                $statusData = $purchaseService->getTxStatus($txHash);
                $status = $statusData['status'] ?? 'error';

                if ($this->option('dry-run')) {
                    $this->line("  [dry-run] id={$history->id} tx={$txHash} on-chain={$status}");
                    continue;
                }

                if ($status === 'confirmed') {
                    $purchaseService->confirmPurchaseTransaction($txHash);
                    $this->info("  Confirmed id={$history->id} (≥{$required} confirmations)");
                } elseif ($status === 'pending') {
                    $count = $statusData['confirmations'] ?? '?';
                    $this->info("  Skipped id={$history->id} (still confirming: {$count}/{$required})");
                } elseif ($status === 'not_found') {
                    $purchaseService->failPurchaseTransaction($txHash);
                    $this->info("  Failed id={$history->id} (not found on chain after {$timeoutMinutes} min)");
                } else {
                    $this->warn("  Skipped id={$history->id}: check error ({$statusData['message']})");
                }
            } catch (\Exception $e) {
                $this->error("  Error id={$history->id}: {$e->getMessage()}");
            }
        }

        return Command::SUCCESS;
    }
}
