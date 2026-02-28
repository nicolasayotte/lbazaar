<?php

namespace Tests\Unit\Models;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\NftTransactions;
use App\Models\User;
use Tests\TestCase;

class CourseHistoryTest extends TestCase
{
    protected User $student1;
    protected User $student2;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $this->createRoles(['student', 'teacher']);

        // Create test users
        $this->student1 = $this->createTestUser(['email' => 'student1@test.com']);
        $this->student1->attachRole('student');

        $this->student2 = $this->createTestUser(['email' => 'student2@test.com']);
        $this->student2->attachRole('student');

        // Create course and schedule
        $teacher = $this->createTestUser();
        $teacher->attachRole('teacher');

        $this->course = Course::factory()->create([
            'professor_id' => $teacher->id,
            'certificate_enabled' => true,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $teacher->id,
        ]);
    }

    /** @test */
    public function test_certificate_transaction_relationship_works_with_single_record_eager_loading()
    {
        // Create course history
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Create matching NFT transaction
        $transaction = NftTransactions::factory()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
        ]);

        // Test relationship WITH eager loading (the fix ensures this works)
        $loadedHistory = CourseHistory::with('possibleCertificateTransactions')->find($history->id);
        $this->assertNotNull($loadedHistory->certificateTransaction);
        $this->assertEquals($transaction->id, $loadedHistory->certificateTransaction->id);
    }

    /** @test */
    public function test_certificate_transaction_relationship_works_with_eager_loading()
    {
        // Create two students with different course histories
        $history1 = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        $history2 = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student2->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Create NFT transactions for each student
        $transaction1 = NftTransactions::factory()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
            'nft_name' => 'Student1_Certificate',
        ]);

        $transaction2 = NftTransactions::factory()->create([
            'user_id' => $this->student2->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
            'nft_name' => 'Student2_Certificate',
        ]);

        // CRITICAL TEST: Eager load relationships for all histories
        $histories = CourseHistory::whereIn('id', [$history1->id, $history2->id])
            ->with('possibleCertificateTransactions')
            ->get();

        // Verify each student sees ONLY their own certificate
        $loadedHistory1 = $histories->firstWhere('id', $history1->id);
        $loadedHistory2 = $histories->firstWhere('id', $history2->id);

        $this->assertNotNull($loadedHistory1->certificateTransaction, 'Student 1 should have certificate transaction');
        $this->assertNotNull($loadedHistory2->certificateTransaction, 'Student 2 should have certificate transaction');

        // THIS IS THE KEY TEST: Each student must see their OWN certificate
        $this->assertEquals($transaction1->id, $loadedHistory1->certificateTransaction->id, 'Student 1 should see their own certificate');
        $this->assertEquals($transaction2->id, $loadedHistory2->certificateTransaction->id, 'Student 2 should see their own certificate');
        $this->assertEquals('Student1_Certificate', $loadedHistory1->certificateTransaction->nft_name);
        $this->assertEquals('Student2_Certificate', $loadedHistory2->certificateTransaction->nft_name);
    }

    /** @test */
    public function test_certificate_transaction_returns_null_when_no_transaction_exists()
    {
        // Create course history without NFT transaction
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Use eager loading to test
        $loadedHistory = CourseHistory::with('possibleCertificateTransactions')->find($history->id);
        $this->assertNull($loadedHistory->certificateTransaction);
    }

    /** @test */
    public function test_certificate_transaction_matches_all_composite_keys()
    {
        // Create course history
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Create NFT transaction with matching user_id and course_id but different schedule_id
        $wrongSchedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->course->professor_id,
        ]);

        NftTransactions::factory()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'schedule_id' => $wrongSchedule->id, // Different schedule
        ]);

        // Create correct transaction
        $correctTransaction = NftTransactions::factory()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id, // Correct schedule
        ]);

        // Relationship should return the correct transaction when eager loaded
        $loadedHistory = CourseHistory::with('possibleCertificateTransactions')->find($history->id);
        $this->assertNotNull($loadedHistory->certificateTransaction);
        $this->assertEquals($correctTransaction->id, $loadedHistory->certificateTransaction->id);
    }

    /** @test */
    public function test_certificate_transaction_does_not_match_wrong_user()
    {
        // Create course history for student1
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Create NFT transaction for student2 (wrong user)
        NftTransactions::factory()->create([
            'user_id' => $this->student2->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
        ]);

        // Relationship should return null (no transaction for student1)
        $loadedHistory = CourseHistory::with('possibleCertificateTransactions')->find($history->id);
        $this->assertNull($loadedHistory->certificateTransaction);
    }

    /** @test */
    public function test_certificate_image_url_from_transaction_metadata()
    {
        $imageUrl = 'https://example.com/certificate-123.png';

        // Create course history
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Create NFT transaction with metadata containing image
        NftTransactions::factory()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
            'metadata' => json_encode(['image' => $imageUrl]),
        ]);

        $loadedHistory = CourseHistory::with('possibleCertificateTransactions')->find($history->id);
        $this->assertEquals($imageUrl, $loadedHistory->certificate_image_url);
    }

    /** @test */
    public function test_certificate_image_url_returns_null_when_no_transaction()
    {
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        $loadedHistory = CourseHistory::with('possibleCertificateTransactions')->find($history->id);
        $this->assertNull($loadedHistory->certificate_image_url);
    }

    /** @test */
    public function test_certificate_explorer_url_generation()
    {
        $txHash = substr(fake()->sha256(), 0, 64);

        $history = CourseHistory::factory()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'certificate_tx_hash' => $txHash,
        ]);

        $explorerUrl = $history->certificate_explorer_url;
        $this->assertNotNull($explorerUrl);
        $this->assertStringContainsString($txHash, $explorerUrl);
        $this->assertStringContainsString('/tx/', $explorerUrl);
    }

    /** @test */
    public function test_certificate_explorer_url_returns_null_without_tx_hash()
    {
        $history = CourseHistory::factory()->create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'certificate_tx_hash' => null,
        ]);

        $this->assertNull($history->certificate_explorer_url);
    }

    // --- Enrollment-time snapshot helper method tests (SC-E02-06) ---

    /** @test */
    public function test_effective_certificate_enabled_returns_snapshot_for_post_migration_row()
    {
        // Post-migration row: enrolled_certificate_enabled is not null (sentinel)
        $history = CourseHistory::factory()->create([
            'user_id'                      => $this->student1->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $this->schedule->id,
            'enrolled_certificate_enabled' => false,
        ]);

        // The course has certificate_enabled = true (set in setUp)
        // but the snapshot says false — snapshot must win
        $this->assertFalse($history->effectiveCertificateEnabled());
    }

    /** @test */
    public function test_effective_certificate_enabled_falls_back_to_course_for_pre_migration_row()
    {
        // Pre-migration row: enrolled_certificate_enabled is null (no snapshot)
        $history = CourseHistory::factory()->create([
            'user_id'                      => $this->student1->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $this->schedule->id,
            'enrolled_certificate_enabled' => null,
        ]);

        // Course has certificate_enabled = true — fallback must use that
        $this->assertTrue($history->effectiveCertificateEnabled());
    }

    /** @test */
    public function test_effective_token_reward_amount_returns_snapshot_value()
    {
        $history = CourseHistory::factory()->create([
            'user_id'                    => $this->student1->id,
            'course_id'                  => $this->course->id,
            'course_schedule_id'         => $this->schedule->id,
            'enrolled_certificate_enabled' => true,
            'enrolled_token_reward_amount' => 500,
        ]);

        $this->assertEquals(500, $history->effectiveTokenRewardAmount());
    }

    /** @test */
    public function test_effective_certificate_image_url_returns_snapshot_for_post_migration_row()
    {
        // Post-migration row: enrolled_certificate_enabled is not null (sentinel)
        $history = CourseHistory::factory()->create([
            'user_id'                          => $this->student1->id,
            'course_id'                        => $this->course->id,
            'course_schedule_id'               => $this->schedule->id,
            'enrolled_certificate_enabled'     => true,
            'enrolled_certificate_image_url'   => 'https://example.com/snapshot-image.png',
        ]);

        $this->assertEquals('https://example.com/snapshot-image.png', $history->effectiveCertificateImageUrl());
    }

    /** @test */
    public function test_effective_certificate_image_url_falls_back_to_course_for_pre_migration_row()
    {
        // Pre-migration row: enrolled_certificate_enabled is null (no snapshot)
        $this->course->certificate_image_url = 'https://example.com/course-image.png';
        $this->course->save();

        $history = CourseHistory::factory()->create([
            'user_id'                      => $this->student1->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $this->schedule->id,
            'enrolled_certificate_enabled' => null,
        ]);

        // Reload to get fresh course relationship
        $history = CourseHistory::with('course')->find($history->id);

        $this->assertEquals('https://example.com/course-image.png', $history->effectiveCertificateImageUrl());
    }

    /** @test */
    public function test_effective_certificate_image_url_returns_null_when_snapshot_is_null()
    {
        // Post-migration row with null image URL in snapshot
        $history = CourseHistory::factory()->create([
            'user_id'                          => $this->student1->id,
            'course_id'                        => $this->course->id,
            'course_schedule_id'               => $this->schedule->id,
            'enrolled_certificate_enabled'     => true,
            'enrolled_certificate_image_url'   => null,
        ]);

        $this->assertNull($history->effectiveCertificateImageUrl());
    }

    /** @test */
    public function test_multiple_students_with_eager_loading_see_correct_certificates()
    {
        // Create 5 students with course histories and certificates
        $students = [];
        $histories = [];
        $transactions = [];

        for ($i = 1; $i <= 5; $i++) {
            $student = $this->createTestUser(['email' => "multistudent{$i}@test.com"]);
            $student->attachRole('student');
            $students[] = $student;

            $history = CourseHistory::factory()->minted()->create([
                'user_id' => $student->id,
                'course_id' => $this->course->id,
                'course_schedule_id' => $this->schedule->id,
            ]);
            $histories[] = $history;

            $transaction = NftTransactions::factory()->create([
                'user_id' => $student->id,
                'course_id' => $this->course->id,
                'schedule_id' => $this->schedule->id,
                'nft_name' => "Certificate_Student_{$i}",
            ]);
            $transactions[] = $transaction;
        }

        // Eager load all histories with certificates
        $historyIds = array_map(fn($h) => $h->id, $histories);
        $loadedHistories = CourseHistory::whereIn('id', $historyIds)
            ->with('possibleCertificateTransactions')
            ->get()
            ->keyBy('id');

        // Verify each student sees ONLY their own certificate
        for ($i = 0; $i < 5; $i++) {
            $history = $histories[$i];
            $transaction = $transactions[$i];
            $loaded = $loadedHistories[$history->id];

            $this->assertNotNull($loaded->certificateTransaction, "Student {$i} should have certificate");
            $this->assertEquals($transaction->id, $loaded->certificateTransaction->id, "Student {$i} should see their own certificate");
            $this->assertEquals("Certificate_Student_" . ($i + 1), $loaded->certificateTransaction->nft_name);
        }
    }
}
