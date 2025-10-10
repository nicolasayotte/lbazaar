<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function tearDown(): void
    {
        // Force rollback any open transactions to prevent DB locks
        while (DB::transactionLevel() > 0) {
            DB::rollBack();
        }
        // Disconnect to ensure clean state
        DB::disconnect();
        parent::tearDown();
    }
}
