<?php

namespace App\Traits;

use Exception;
use Illuminate\Support\Facades\Log;

trait Web3CommandTrait
{
    protected function buildWeb3Command(string $scriptRelativePath, array $arguments = []): string
    {
        $web3Directory = base_path('web3');
        $scriptPath = './' . ltrim($scriptRelativePath, '/');
        $logPath = storage_path('logs/web3.log');

        $argumentString = '';
        if (!empty($arguments)) {
            $argumentString = ' ' . implode(' ', array_map('escapeshellarg', $arguments));
        }

        return sprintf(
            '(cd %s && node %s%s) 2>> %s',
            escapeshellarg($web3Directory),
            escapeshellarg($scriptPath),
            $argumentString,
            escapeshellarg($logPath)
        );
    }

    protected function runCommand(string $command, int $timeout = 30): string
    {
        $output = [];
        $returnVar = null;

        $timedCommand = sprintf('timeout %d %s', $timeout, $command);

        exec($timedCommand, $output, $returnVar);

        if ($returnVar === 124) {
            Log::error('Command execution timed out', [
                'command' => $command,
                'timeout' => $timeout,
            ]);
            throw new Exception("Command execution timed out after {$timeout} seconds");
        }

        if ($returnVar !== 0) {
            Log::error('Command execution failed', [
                'command' => $command,
                'exit_code' => $returnVar,
            ]);
        }

        return trim(implode(PHP_EOL, $output));
    }
}
