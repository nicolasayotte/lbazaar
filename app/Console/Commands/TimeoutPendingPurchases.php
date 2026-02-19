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

        if ($this->option('dry-run')) {
            foreach ($stale as $history) {
                $this->line("  [dry-run] Would fail course_history_id={$history->id} tx={$history->payment_tx_hash}");
            }
            return Command::SUCCESS;
        }

        foreach ($stale as $history) {
            $result = $purchaseService->failPurchaseTransaction($history->payment_tx_hash);
            if ($result['success']) {
                $this->info("  Failed course_history_id={$history->id} tx={$history->payment_tx_hash}");
            } else {
                $this->warn("  Skipped course_history_id={$history->id}: {$result['message']}");
            }
        }

        return Command::SUCCESS;
    }
}
