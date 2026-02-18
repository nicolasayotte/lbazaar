<?php

namespace Tests;

use App\Models\Role;
use App\Models\CourseType;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

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
