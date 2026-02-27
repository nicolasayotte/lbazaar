<?php

namespace App\Services\API;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CardanoNetworkService
{
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
            $output = $this->runCommand($cmd);
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
            Cache::put(self::CACHE_KEY, $result, config('services.cardano.network_health_cache_ttl', 60));
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

    protected function buildWeb3Command(string $scriptRelativePath, array $arguments = []): string
    {
        $web3Directory = base_path('web3');
        $scriptPath = './' . ltrim($scriptRelativePath, '/');
        $logPath = storage_path('logs/web3.log');
        $argumentString = '';
        if (!empty($arguments)) {
            $argumentString = ' ' . implode(' ', array_map('escapeshellarg', $arguments));
        }
        return sprintf('(cd %s && node %s%s) 2>> %s',
            escapeshellarg($web3Directory), escapeshellarg($scriptPath), $argumentString, escapeshellarg($logPath));
    }

    protected function runCommand(string $command, int $timeout = 15): string
    {
        $timedCommand = sprintf('timeout %d %s', $timeout, $command);
        return shell_exec($timedCommand) ?? '';
    }
}
