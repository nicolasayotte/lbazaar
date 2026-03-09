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
        $envFile = base_path('.env');

        $argumentString = '';
        if (!empty($arguments)) {
            $argumentString = ' ' . implode(' ', array_map('escapeshellarg', $arguments));
        }

        return sprintf(
            '(cd %s && node --env-file=%s %s%s) 2>> %s',
            escapeshellarg($web3Directory),
            escapeshellarg($envFile),
            escapeshellarg($scriptPath),
            $argumentString,
            escapeshellarg($logPath)
        );
    }

    protected function runCommand(string $command, int $timeout = 30): string
    {
        if (app()->environment('testing')) {
            throw new \RuntimeException(
                'runCommand() must be mocked in tests. Use shouldAllowMockingProtectedMethods() and shouldReceive(\'runCommand\'). Command: '
                . substr($command, 0, 100)
            );
        }

        $output = [];
        $returnVar = null;

        $timedCommand = sprintf('timeout %d bash -c %s', $timeout, escapeshellarg($command));

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

        $raw = trim(implode(PHP_EOL, $output));

        // Helios prints INFO lines to stdout during contract compilation.
        // Extract the last JSON object from the output.
        if (preg_match('/\{.*\}\s*$/s', $raw, $matches)) {
            return $matches[0];
        }

        return $raw;
    }
}
