<?php

namespace Tests\Unit\Repositories;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Repositories\CourseTypeRepository;
use App\Models\CourseType;
use Database\Seeders\CourseTypeSeeder;

class CourseTypeRepositoryTest extends TestCase
{
    use DatabaseTransactions;

    protected CourseTypeRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed course types
        $seeder = new CourseTypeSeeder();
        $seeder->run();

        // Initialize repository
        $this->repository = new CourseTypeRepository();
    }

    /** @test */
    public function test_get_dropdown_data_excludes_earn_type(): void
    {
        // Act: Get dropdown data
        $dropdownData = $this->repository->getDropdownData();

        // Assert: Earn type is excluded
        $ids = $dropdownData->pluck('id')->toArray();
        $names = $dropdownData->pluck('name')->toArray();

        $this->assertNotContains(CourseType::EARN_ID, $ids, 'Earn type ID should not be in dropdown data');
        $this->assertNotContains(CourseType::EARN, $names, 'Earn type name should not be in dropdown data');
    }

    /** @test */
    public function test_get_dropdown_data_returns_correct_structure(): void
    {
        // Act
        $dropdownData = $this->repository->getDropdownData();

        // Assert: Returns 3 types (General, Free, Special - excluding Earn)
        $this->assertCount(3, $dropdownData, 'Should return exactly 3 course types');

        // Assert: Each item has correct structure
        foreach ($dropdownData as $item) {
            $this->assertArrayHasKey('id', $item);
            $this->assertArrayHasKey('name', $item);
        }

        // Assert: Contains expected types
        $ids = $dropdownData->pluck('id')->toArray();
        $this->assertContains(CourseType::GENERAL_ID, $ids, 'Should include General type');
        $this->assertContains(CourseType::FREE_ID, $ids, 'Should include Free type');
        $this->assertContains(CourseType::SPECIAL_ID, $ids, 'Should include Special type');
    }

    /** @test */
    public function test_existing_earn_courses_remain_accessible(): void
    {
        // Act: Directly access Earn type from database
        $earnType = CourseType::find(CourseType::EARN_ID);

        // Assert: Earn type still exists in database for backwards compatibility
        $this->assertNotNull($earnType, 'Earn type should still exist in database');
        $this->assertEquals(CourseType::EARN, $earnType->name, 'Earn type should have correct name');
        $this->assertEquals(CourseType::EARN_ID, $earnType->id, 'Earn type should have correct ID');
    }

    /** @test */
    public function test_find_by_name_still_works_for_earn(): void
    {
        // Act: Find Earn type by name using repository method
        $earnType = $this->repository->findByName(CourseType::EARN);

        // Assert: Should be able to find Earn type for backwards compatibility
        $this->assertNotNull($earnType, 'Should be able to find Earn type by name');
        $this->assertEquals(CourseType::EARN_ID, $earnType->id, 'Found type should have Earn ID');
        $this->assertEquals(CourseType::EARN, $earnType->type, 'Found type should have Earn type value');
    }

    /** @test */
    public function test_pluck_by_id_returns_all_types_including_earn(): void
    {
        // Act
        $allTypes = $this->repository->pluckById();

        // Assert: Should include all 4 types including Earn (for backwards compatibility)
        $this->assertCount(4, $allTypes, 'pluckById should return all 4 types');
        $this->assertArrayHasKey(CourseType::EARN_ID, $allTypes->toArray(), 'Should include Earn type');
        $this->assertEquals(CourseType::EARN, $allTypes[CourseType::EARN_ID], 'Earn type should have correct name');
    }

    /** @test */
    public function test_dropdown_data_only_excludes_earn_not_other_types(): void
    {
        // Act
        $dropdownData = $this->repository->getDropdownData();
        $names = $dropdownData->pluck('name')->toArray();

        // Assert: Should include General, Free, Special
        $this->assertContains(CourseType::GENERAL, $names, 'Should include General type');
        $this->assertContains(CourseType::FREE, $names, 'Should include Free type');
        $this->assertContains(CourseType::SPECIAL, $names, 'Should include Special type');

        // Assert: Should NOT include Earn
        $this->assertNotContains(CourseType::EARN, $names, 'Should NOT include Earn type');
    }
}
