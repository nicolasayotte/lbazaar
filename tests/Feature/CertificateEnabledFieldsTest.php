<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CertificateEnabledFieldsTest extends TestCase
{
    /**
     * Test certificate_enabled column exists on course_applications table
     */
    public function test_course_applications_has_certificate_enabled_column()
    {
        $this->assertTrue(
            Schema::hasColumn('course_applications', 'certificate_enabled'),
            'course_applications table should have certificate_enabled column'
        );
    }

    /**
     * Test certificate_enabled column exists on courses table
     */
    public function test_courses_has_certificate_enabled_column()
    {
        $this->assertTrue(
            Schema::hasColumn('courses', 'certificate_enabled'),
            'courses table should have certificate_enabled column'
        );
    }

    /**
     * Test certificate_status column exists on course_histories table
     */
    public function test_course_histories_has_certificate_status_column()
    {
        $this->assertTrue(
            Schema::hasColumn('course_histories', 'certificate_status'),
            'course_histories table should have certificate_status column'
        );
    }

    /**
     * Test certificate_tx_hash column exists on course_histories table
     */
    public function test_course_histories_has_certificate_tx_hash_column()
    {
        $this->assertTrue(
            Schema::hasColumn('course_histories', 'certificate_tx_hash'),
            'course_histories table should have certificate_tx_hash column'
        );
    }

    /**
     * Test certificate_minted_at column exists on course_histories table
     */
    public function test_course_histories_has_certificate_minted_at_column()
    {
        $this->assertTrue(
            Schema::hasColumn('course_histories', 'certificate_minted_at'),
            'course_histories table should have certificate_minted_at column'
        );
    }

    /**
     * Test CourseApplication model can save certificate_enabled field
     */
    public function test_course_application_can_save_certificate_enabled()
    {
        $professor = $this->createTestUser();
        $courseApplication = CourseApplication::factory()->create([
            'professor_id' => $professor->id,
            'certificate_enabled' => true
        ]);

        $this->assertTrue($courseApplication->certificate_enabled);
        $this->assertDatabaseHas('course_applications', [
            'id' => $courseApplication->id,
            'certificate_enabled' => true
        ]);
    }

    /**
     * Test Course model can save certificate_enabled field
     */
    public function test_course_can_save_certificate_enabled()
    {
        $professor = $this->createTestUser();
        $course = Course::factory()->create([
            'professor_id' => $professor->id,
            'certificate_enabled' => true
        ]);

        $this->assertTrue($course->certificate_enabled);
        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'certificate_enabled' => true
        ]);
    }

    /**
     * Test CourseHistory model can save certificate fields
     */
    public function test_course_history_can_save_certificate_fields()
    {
        $user = $this->createTestUser();
        $course = Course::factory()->create();
        $courseSchedule = CourseSchedule::factory()->create([
            'course_id' => $course->id
        ]);
        $txHash = 'abc123def456';
        $mintedAt = now();

        $courseHistory = CourseHistory::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_schedule_id' => $courseSchedule->id,
            'certificate_status' => 'minted',
            'certificate_tx_hash' => $txHash,
            'certificate_minted_at' => $mintedAt
        ]);

        $this->assertEquals('minted', $courseHistory->certificate_status);
        $this->assertEquals($txHash, $courseHistory->certificate_tx_hash);
        $this->assertNotNull($courseHistory->certificate_minted_at);

        $this->assertDatabaseHas('course_histories', [
            'id' => $courseHistory->id,
            'certificate_status' => 'minted',
            'certificate_tx_hash' => $txHash
        ]);
    }

    /**
     * Test certificate_enabled defaults to false
     */
    public function test_certificate_enabled_defaults_to_false()
    {
        $professor = $this->createTestUser();

        $courseApplication = CourseApplication::factory()->create([
            'professor_id' => $professor->id
        ]);

        $course = Course::factory()->create([
            'professor_id' => $professor->id
        ]);

        // Refresh to get fresh data from database with casts applied
        $courseApplication->refresh();
        $course->refresh();

        $this->assertFalse($courseApplication->certificate_enabled);
        $this->assertFalse($course->certificate_enabled);
    }
}
