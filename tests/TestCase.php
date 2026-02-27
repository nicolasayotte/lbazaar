<?php

namespace Tests;

use App\Models\Role;
use App\Models\CourseType;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Mockery;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication, DatabaseTransactions;

    /**
     * Retry a callback that may fail with "MySQL server has gone away" under
     * parallel workers. When 2006 occurs inside a DatabaseTransactions test,
     * the dead connection's transaction is auto-rolled back by MySQL. We purge
     * the dead connection, start a fresh transaction, and retry from scratch.
     */
    protected function retryOnDisconnect(callable $fn): void
    {
        try {
            $fn();
        } catch (\Illuminate\Database\QueryException $e) {
            if (! str_contains($e->getMessage(), 'server has gone away')) {
                throw $e;
            }
            DB::purge();
            DB::reconnect();
            DB::beginTransaction();
            $fn();
        }
    }

    /**
     * Ensure roles exist.
     * Uses find-or-create to avoid FK constraint violations on seeded databases
     * while still working on fresh parallel databases.
     */
    protected function createRoles(array $names = ['teacher', 'student']): void
    {
        foreach ($names as $name) {
            Role::where('name', $name)->first()
                ?? Role::create(['name' => $name, 'display_name' => ucfirst($name)]);
        }
    }

    /**
     * Create or find a CourseType.
     * Uses find-or-create to avoid FK constraint violations from delete
     * while still working on fresh parallel databases.
     */
    protected function createCourseType(string $name = 'general', string $type = 'general'): CourseType
    {
        return CourseType::where('name', $name)->where('type', $type)->first()
            ?? CourseType::create(['name' => $name, 'type' => $type]);
    }

    /**
     * Create a User without triggering model events (e.g. custodial address generation).
     * Provides a dummy custodial_address by default.
     */
    protected function createTestUser(array $attributes = []): User
    {
        return User::withoutEvents(function () use ($attributes) {
            return User::factory()->create(array_merge([
                'custodial_address' => 'addr_test_' . uniqid(),
            ], $attributes));
        });
    }

    /**
     * Disable User model event listeners for the current test.
     * Use when application code (e.g. HTTP requests) creates users and you need
     * to suppress web3 calls globally, not just for a single factory call.
     */
    protected function disableUserModelEvents(): void
    {
        User::flushEventListeners();
        User::boot();
    }

    /**
     * Skip the test unless real Stripe test keys are configured.
     * Mirrors the logic in InteractsWithRealServices without requiring the trait.
     */
    protected function skipUnlessStripeConfigured(): void
    {
        $secret = config('services.stripe.secret');

        if (empty($secret) || str_contains(strtolower($secret), 'sk_test_xxx')) {
            $this->markTestSkipped('STRIPE_SECRET not configured — skipping integration test.');
        }
    }

    protected function tearDown(): void
    {
        // Force rollback any open transactions to prevent DB locks.
        // If the connection died mid-test (2006), rollBack throws — catch it
        // and purge the dead connection so the next test gets a fresh one.
        try {
            while (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
        } catch (\Illuminate\Database\QueryException $e) {
            DB::purge();
        }
        parent::tearDown();
        // Mockery::close() MUST run after parent::tearDown() so the DB transaction
        // is rolled back before mock expectations are verified. If close() throws
        // (unmet expectation) before rollback, the open transaction holds locks and
        // blocks all subsequent tests. Safe to call even when Mockery wasn't used.
        Mockery::close();
    }
}
