<?php

namespace App\Services\API;

use App\Traits\Web3CommandTrait;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CardanoNetworkService
{
    use Web3CommandTrait;

    const STATUS_HEALTHY = 'healthy';
    const STATUS_DEGRADED = 'degraded';
    const STATUS_UNREACHABLE = 'unreachable';
    const CACHE_KEY = 'cardano_network_status';

    public function getNetworkStatus(): array
    {
        $cached = Cache::get(self::CACHE_KEY);
        if ($cached !== null) return $cached;

        try {
            $cmd = $this->buildWeb3Command('run/check-network-health.mjs');
            $output = $this->runCommand($cmd, 15);
            if (empty($output)) {
                Log::warning('CardanoNetworkService: empty output');
                return $this->unreachable();
            }
            $data = json_decode($output, true);
            if (!is_array($data) || ($data['status'] ?? 0) !== 200) {
                Log::warning('CardanoNetworkService: unexpected output', ['output' => substr($output ?? '', 0, 200)]);
                return $this->unreachable();
            }
            $result = [
                'status' => $data['networkStatus'] ?? self::STATUS_UNREACHABLE,
                'lastBlockTime' => $data['latestBlock']['time'] ?? null,
            ];
            if ($result['status'] === self::STATUS_HEALTHY) {
                try {
                    Cache::put(self::CACHE_KEY, $result, config('services.cardano.network_health_cache_ttl', 60));
                } catch (\Throwable $cacheEx) {
                    Log::warning('CardanoNetworkService: cache write failed', ['error' => $cacheEx->getMessage()]);
                }
            }
            return $result;
        } catch (\Throwable $e) {
            Log::warning('CardanoNetworkService: exception', ['error' => $e->getMessage()]);
            return $this->unreachable();
        }
    }

    private function unreachable(): array
    {
        return ['status' => self::STATUS_UNREACHABLE, 'lastBlockTime' => null];
    }
}
