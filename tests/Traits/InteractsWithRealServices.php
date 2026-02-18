<?php

namespace Tests\Traits;

/**
 * Safety trait for integration tests that hit real external APIs.
 *
 * - Hard-blocks execution in production environment
 * - Skips tests when required API keys are missing or placeholder values
 *
 * PHPUnit 9 auto-calls setUp{TraitName}() — no explicit wiring needed.
 */
trait InteractsWithRealServices
{
    /**
     * Return required service keys as ['DISPLAY_NAME' => 'config.path'].
     * Tests are skipped when any key is missing or a placeholder.
     */
    abstract protected function requiredServiceKeys(): array;

    protected function setUpInteractsWithRealServices(): void
    {
        if (app()->environment('production')) {
            $this->markTestSkipped('Integration tests disabled in production.');
        }

        foreach ($this->requiredServiceKeys() as $name => $configPath) {
            $value = config($configPath);

            if (empty($value) || $this->isPlaceholder($value)) {
                $this->markTestSkipped("{$name} not configured — skipping integration test.");
            }
        }
    }

    /**
     * Detect common placeholder patterns from .env.example.
     */
    protected function isPlaceholder(string $value): bool
    {
        $lower = strtolower(trim($value));

        $patterns = [
            'xxx',
            'goes here',
            'your_',
            'sk_test_xxx',
            'pk_test_xxx',
            'whsec_xxx',
            'blockfrost.io key',
            'test-blockfrost-key',
            'owner-pkh-test',
            'key goes here',
            'auth token from',
        ];

        foreach ($patterns as $pattern) {
            if (str_contains($lower, $pattern)) {
                return true;
            }
        }

        // Very short values are likely placeholders
        if (strlen(trim($value)) < 8) {
            return true;
        }

        return false;
    }
}
