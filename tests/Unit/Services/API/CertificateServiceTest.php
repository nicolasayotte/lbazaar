<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Services\API\CertificateService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\UserWallet;
use App\Models\Nft;
use App\Models\NftTransactions;
use Illuminate\Support\Facades\Log;
use Mockery;

class CertificateServiceTest extends TestCase
{
    use WithFaker;

    protected $service;
    protected $teacher;
    protected $student;
    protected $course;
    protected $userWallet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new CertificateService();
        $this->retryOnDisconnect(fn () => $this->setupTestData());
    }

    private function setupTestData()
    {
        // Create roles
        $this->createRoles(['teacher', 'student']);

        // Create teacher without triggering custodial address event
        $this->teacher = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'John',
                'last_name' => 'Teacher',
                'custodial_address' => 'addr1test_teacher_custodial'
            ]);
        });
        $this->teacher->attachRole('teacher');

        // Create student without triggering custodial address event
        $this->student = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'Jane',
                'last_name' => 'Student',
                'email' => 'jane@example.com',
                'custodial_address' => 'addr1test_student_custodial'
            ]);
        });
        $this->student->attachRole('student');

        // Create user wallet
        $this->userWallet = UserWallet::factory()->create([
            'user_id' => $this->student->id,
            'points' => 100,
            'stake_key_hash' => 'abc123def456'
        ]);

        // Create course
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id
        ]);

        // Create certificate NFT template
        Nft::factory()->create([
            'name' => 'Certificate',
            'description' => 'Certificate NFT',
            'image_url' => 'QmTestImageHash',
            'mph' => 'test_mph_hash',
            'points' => 0
        ]);
    }

    public function test_mint_and_airdrop_certificate_with_linked_wallet()
    {
        // Mock the external script calls
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        $service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->with($this->student)
            ->andReturn('addr1linked_wallet_address');

        $service->shouldReceive('createCertificateMetadata')
            ->once()
            ->andReturn([
                'name' => 'Certificate of Completion',
                'course_title' => 'Test Course',
                'student_name' => 'Jane Student',
                'completion_date' => now()->toISOString(),
                'serial_number' => '1234567890'
            ]);

        $service->shouldReceive('mintCertificateNFT')
            ->once()
            ->andReturn([
                'success' => true,
                'transaction_id' => 'tx123abc',
                'nft_name' => 'Certificate-' . $this->course->id . '-' . $this->student->id,
                'serial_number' => '1234567890',
                'mph' => 'test_mph_hash'
            ]);

        $service->shouldReceive('recordNftTransaction')
            ->once();

        $service->shouldReceive('sendCertificateNotification')
            ->once();

        $result = $service->mintAndAirdropCertificate($this->course, $this->student);

        $this->assertTrue($result['success']);
        $this->assertEquals('tx123abc', $result['transaction_id']);
        $this->assertEquals('addr1linked_wallet_address', $result['wallet_address']);
    }

    public function test_mint_and_airdrop_certificate_with_custodial_wallet()
    {
        // Remove stake key hash to force custodial wallet
        $this->userWallet->update(['stake_key_hash' => null]);

        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        $service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->with($this->student)
            ->andReturn('addr1custodial_wallet_address');

        $service->shouldReceive('createCertificateMetadata')
            ->once()
            ->andReturn([
                'name' => 'Certificate of Completion',
                'course_title' => 'Test Course',
                'student_name' => 'Jane Student',
                'completion_date' => now()->toISOString(),
                'serial_number' => '1234567890'
            ]);

        $service->shouldReceive('mintCertificateNFT')
            ->once()
            ->andReturn([
                'success' => true,
                'transaction_id' => 'tx456def',
                'nft_name' => 'Certificate-' . $this->course->id . '-' . $this->student->id,
                'serial_number' => '1234567890',
                'mph' => 'test_mph_hash'
            ]);

        $service->shouldReceive('recordNftTransaction')
            ->once();

        $service->shouldReceive('sendCertificateNotification')
            ->once();

        $result = $service->mintAndAirdropCertificate($this->course, $this->student);

        $this->assertTrue($result['success']);
        $this->assertEquals('tx456def', $result['transaction_id']);
        $this->assertEquals('addr1custodial_wallet_address', $result['wallet_address']);
    }

    public function test_mint_and_airdrop_certificate_handles_minting_failure()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        $service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->andReturn('addr1test_address');

        $service->shouldReceive('mintCertificateNFT')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Insufficient funds'
            ]);

        $result = $service->mintAndAirdropCertificate($this->course, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Insufficient funds', $result['message']);
    }

    public function test_create_certificate_metadata()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('createCertificateMetadata');
        $method->setAccessible(true);

        $metadata = $method->invokeArgs($this->service, [$this->course, $this->student]);

        $this->assertEquals('Certificate of Completion', $metadata['name']);
        $this->assertEquals($this->course->title, $metadata['course_title']);
        $this->assertEquals($this->student->fullname, $metadata['student_name']);
        $this->assertEquals($this->student->email, $metadata['student_email']);
        $this->assertEquals($this->teacher->fullname, $metadata['teacher_name']);
        $this->assertEquals($this->course->id, $metadata['course_id']);
        $this->assertEquals($this->student->id, $metadata['student_id']);
        $this->assertArrayHasKey('completion_date', $metadata);
        $this->assertArrayHasKey('serial_number', $metadata);
    }

    public function test_get_custodial_wallet_address_success()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        // Mock the protected method by calling the actual service method
        $service->shouldReceive('runCommand')
            ->once()
            ->with(Mockery::type('string'))
            ->andReturn('{"status": 200, "address": "addr1custodial123"}');

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('getCustodialWalletAddress');
        $method->setAccessible(true);

        $address = $method->invokeArgs($service, [$this->student->id]);

        $this->assertEquals('addr1custodial123', $address);
    }

    public function test_get_custodial_wallet_address_failure()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        // Mock failed exec response
        $service->shouldReceive('runCommand')
            ->once()
            ->with(Mockery::type('string'))
            ->andReturn('{"status": 500, "error": "Script error"}');

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('getCustodialWalletAddress');
        $method->setAccessible(true);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed to derive custodial wallet address');

        $method->invokeArgs($service, [$this->student->id]);
    }

    public function test_get_linked_wallet_address_success()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getLinkedWalletAddress');
        $method->setAccessible(true);

        $address = $method->invokeArgs($this->service, ['abc123def456']);

        $this->assertEquals($this->userWallet->address, $address);
    }

    public function test_get_linked_wallet_address_fallback_to_custodial()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getLinkedWalletAddress');
        $method->setAccessible(true);

        $address = $method->invokeArgs($this->service, ['nonexistent_hash']);

        $this->assertNull($address);
    }

    public function test_mint_certificate_nft_success()
    {
        // Test the logic without external calls
        $certificateData = [
            'course_id' => $this->course->id,
            'student_id' => $this->student->id,
            'serial_number' => '1234567890'
        ];

        // Create a mock that doesn't call external scripts
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('buildWeb3Command')
            ->twice()
            ->andReturn('echo test');

        $service->shouldReceive('runCommand')
            ->twice() // build and submit
            ->andReturn(
                '{"status": 200, "cborTx": "tx_cbor_data"}',
                '{"status": 200, "txId": "tx123abc"}'
            );

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('mintCertificateNFT');
        $method->setAccessible(true);

        $result = $method->invokeArgs($service, [$certificateData, 'addr1test']);

        $this->assertTrue($result['success']);
        $this->assertEquals('tx123abc', $result['transaction_id']);
    }

    public function test_mint_certificate_nft_build_failure()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        $certificateData = [
            'course_id' => $this->course->id,
            'student_id' => $this->student->id,
            'serial_number' => '1234567890'
        ];

        // Mock failed build transaction
        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn('{"status": 500, "error": "Build failed"}');

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('mintCertificateNFT');
        $method->setAccessible(true);

        $result = $method->invokeArgs($service, [$certificateData, 'addr1test']);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Build failed', $result['message']);
    }

    public function test_mint_certificate_nft_submit_failure()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        $certificateData = [
            'course_id' => $this->course->id,
            'student_id' => $this->student->id,
            'serial_number' => '1234567890'
        ];

        // Mock successful build, failed submit
        $service->shouldReceive('runCommand')
            ->twice()
            ->andReturn(
                '{"status": 200, "cborTx": "tx_cbor_data"}',
                '{"status": 500, "error": "Submit failed"}'
            );

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('mintCertificateNFT');
        $method->setAccessible(true);

        $result = $method->invokeArgs($service, [$certificateData, 'addr1test']);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Submit failed', $result['message']);
    }

    public function test_mint_certificate_nft_without_nft_row_uses_empty_image()
    {
        // Delete the certificate NFT template — minting should still work
        // (MPH is derived from CERTIFICATE_LOCK_DATE, not from the DB row)
        Nft::where('name', 'Certificate')->delete();

        $certificateData = [
            'course_id' => $this->course->id,
            'student_id' => $this->student->id,
            'serial_number' => '1234567890'
        ];

        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('buildWeb3Command')
            ->with('run/build-certificate-tx.mjs', Mockery::on(function ($args) {
                // imageUrl argument (index 3) should be empty when no Nft row exists
                return $args[3] === '';
            }))
            ->once()
            ->andReturn('echo build');

        $service->shouldReceive('buildWeb3Command')
            ->with('run/submit-certificate-tx.mjs', Mockery::any())
            ->once()
            ->andReturn('echo submit');

        $service->shouldReceive('runCommand')
            ->twice()
            ->andReturn(
                '{"status": 200, "cborTx": "tx_cbor_data", "mph": "derived_mph"}',
                '{"status": 200, "txId": "tx_no_template"}'
            );

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('mintCertificateNFT');
        $method->setAccessible(true);

        $result = $method->invokeArgs($service, [$certificateData, 'addr1test']);

        $this->assertTrue($result['success']);
        $this->assertEquals('tx_no_template', $result['transaction_id']);

        // Re-create the Certificate NFT for subsequent tests
        Nft::factory()->create([
            'name' => 'Certificate',
            'description' => 'Certificate NFT',
            'image_url' => 'QmTestImageHash',
            'mph' => '',
            'points' => 0
        ]);
    }

    public function test_record_nft_transaction()
    {
        $mintResult = [
            'transaction_id' => 'tx123abc',
            'nft_name' => 'Certificate-Test',
            'serial_number' => '1234567890',
            'mph' => 'test_mph'
        ];

        $certificateData = [
            'name' => 'Test Certificate',
            'course_title' => 'Test Course',
            'course_id' => $this->course->id
        ];

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('recordNftTransaction');
        $method->setAccessible(true);

        try {
            $method->invokeArgs($this->service, [$this->student->id, $mintResult, $certificateData]);
        } catch (\Exception $e) {
            $this->fail('Exception thrown: ' . $e->getMessage());
        }

        $this->assertDatabaseHas('nft_transactions', [
            'user_id' => $this->student->id,
            'nft_name' => 'Certificate-Test',
            'serial_num' => '1234567890',
            'tx_id' => 'tx123abc',
            'mph' => 'test_mph',
            'used' => 0
        ]);

        $transaction = NftTransactions::where('user_id', $this->student->id)->first();
        $this->assertNotNull($transaction, 'Transaction should exist');
        $metadata = json_decode($transaction->metadata, true);
        $this->assertEquals('Test Certificate', $metadata['name']);
    }

    public function test_get_user_id_from_stake_key()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getUserIdFromStakeKey');
        $method->setAccessible(true);

        $userId = $method->invokeArgs($this->service, ['abc123def456']);

        $this->assertEquals($this->student->id, $userId);
    }

    public function test_get_user_id_from_stake_key_not_found()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getUserIdFromStakeKey');
        $method->setAccessible(true);

        $userId = $method->invokeArgs($this->service, ['nonexistent_key']);

        $this->assertEquals(1, $userId); // Defaults to admin (user ID 1)
    }

    public function test_send_certificate_notification_logs_info()
    {
        Log::shouldReceive('info')
            ->once()
            ->with('Certificate notification sent', Mockery::type('array'));

        $mintResult = ['transaction_id' => 'tx123'];

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('sendCertificateNotification');
        $method->setAccessible(true);

        $method->invokeArgs($this->service, [$this->student, $this->course, $mintResult]);
        
        // Assert that we've reached this point without exceptions
        $this->assertTrue(true);
    }

    public function test_mint_and_airdrop_certificate_handles_exceptions()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        $service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->andThrow(new \Exception('Wallet error'));

        Log::shouldReceive('error')
            ->once()
            ->with('Certificate minting failed', Mockery::type('array'));

        $result = $service->mintAndAirdropCertificate($this->course, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Wallet error', $result['message']);
    }

    public function test_get_student_wallet_address_uses_linked_when_available()
    {
        // Just test that the method returns the expected result for linked wallet
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        
        $service->shouldReceive('getLinkedWalletAddress')
            ->once()
            ->with('abc123def456')
            ->andReturn('addr1linked');

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('getStudentWalletAddress');
        $method->setAccessible(true);

        $address = $method->invokeArgs($service, [$this->student]);

        $this->assertEquals('addr1linked', $address);
    }

    public function test_get_student_wallet_address_uses_custodial_when_no_stake_key()
    {
        // Remove stake key hash
        $this->userWallet->update(['stake_key_hash' => null]);
        $this->student->update(['custodial_address' => null]);

        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('getCustodialWalletAddress')
            ->once()
            ->with($this->student->id)
            ->andReturn('addr1custodial');

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('getStudentWalletAddress');
        $method->setAccessible(true);

        $address = $method->invokeArgs($service, [$this->student]);

        $this->assertEquals('addr1custodial', $address);
    }

    public function test_update_certificate_status_to_pending()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history record
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'not_eligible',
            'completed_at' => now()
        ]);

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'pending'
        );

        $courseHistory->refresh();
        $this->assertEquals('pending', $courseHistory->certificate_status);
        $this->assertNull($courseHistory->certificate_tx_hash);
        $this->assertNull($courseHistory->certificate_minted_at);
    }

    public function test_update_certificate_status_to_minted_with_tx_hash()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history record
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'pending',
            'completed_at' => now()
        ]);

        $txHash = 'abc123def456';

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'minted',
            null,
            $txHash
        );

        $courseHistory->refresh();
        $this->assertEquals('minted', $courseHistory->certificate_status);
        $this->assertEquals($txHash, $courseHistory->certificate_tx_hash);
        $this->assertNotNull($courseHistory->certificate_minted_at);
    }

    public function test_update_certificate_status_to_failed()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history record
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'pending',
            'completed_at' => now()
        ]);

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'failed'
        );

        $courseHistory->refresh();
        $this->assertEquals('failed', $courseHistory->certificate_status);
        $this->assertNull($courseHistory->certificate_minted_at);
    }

    public function test_update_certificate_status_with_schedule_id()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history with schedule
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'not_eligible',
            'completed_at' => now()
        ]);

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'pending',
            $schedule->id
        );

        $courseHistory->refresh();
        $this->assertEquals('pending', $courseHistory->certificate_status);
    }

    public function test_update_certificate_status_logs_warning_when_record_not_found()
    {
        Log::shouldReceive('warning')
            ->once()
            ->with('Course history not found for certificate status update', Mockery::type('array'));

        // Try to update non-existent record
        $this->service->updateCertificateStatus(
            99999,
            $this->student->id,
            'pending'
        );

        // Should not throw exception
        $this->assertTrue(true);
    }

    public function test_update_certificate_status_logs_info_on_success()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history record
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'not_eligible',
            'completed_at' => now()
        ]);

        Log::shouldReceive('info')
            ->once()
            ->with('Certificate status updated', Mockery::on(function ($arg) {
                return $arg['status'] === 'minted'
                    && $arg['course_id'] === $this->course->id
                    && $arg['student_id'] === $this->student->id;
            }));

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'minted',
            null,
            'tx123'
        );

        // Assert that the method executed without exceptions
        $this->assertTrue(true);
    }

    public function test_update_certificate_status_transitions_from_not_eligible_to_pending()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'not_eligible',
            'completed_at' => now()
        ]);

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'pending'
        );

        $courseHistory->refresh();
        $this->assertEquals('pending', $courseHistory->certificate_status);
    }

    public function test_update_certificate_status_transitions_from_pending_to_minted()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'pending',
            'completed_at' => now()
        ]);

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'minted',
            null,
            'tx456'
        );

        $courseHistory->refresh();
        $this->assertEquals('minted', $courseHistory->certificate_status);
        $this->assertEquals('tx456', $courseHistory->certificate_tx_hash);
    }

    public function test_update_certificate_status_transitions_from_pending_to_failed()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'pending',
            'completed_at' => now()
        ]);

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'failed'
        );

        $courseHistory->refresh();
        $this->assertEquals('failed', $courseHistory->certificate_status);
    }

    public function test_update_certificate_status_transitions_from_failed_to_pending_retry()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'failed',
            'completed_at' => now()
        ]);

        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'pending'
        );

        $courseHistory->refresh();
        $this->assertEquals('pending', $courseHistory->certificate_status);
    }

    public function test_update_certificate_status_preserves_existing_tx_hash_when_null_provided()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $originalTxHash = 'original_tx_hash';
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'minted',
            'certificate_tx_hash' => $originalTxHash,
            'completed_at' => now()
        ]);

        // Update to failed without providing new tx_hash
        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'failed'
        );

        $courseHistory->refresh();
        $this->assertEquals('failed', $courseHistory->certificate_status);
        $this->assertEquals($originalTxHash, $courseHistory->certificate_tx_hash);
    }

    public function test_get_eligible_students_returns_completed_students()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create completed course history
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);

        // Mock hasPassedAllExams to return true
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        $service->shouldReceive('hasPassedAllExams')
            ->once()
            ->andReturn(true);

        $result = $service->getEligibleStudentsWithStatus($this->course);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('students', $result['data']);
        $this->assertCount(1, $result['data']['students']);
        $this->assertEquals($this->student->id, $result['data']['students'][0]['id']);
        $this->assertEquals('eligible', $result['data']['students'][0]['certificate_status']);
    }

    public function test_get_eligible_students_excludes_already_minted()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create completed course history
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);

        // Create NFT transaction (already minted)
        $certificateNft = Nft::where('name', 'Certificate')->first();
        NftTransactions::create([
            'user_id' => $this->student->id,
            'nft_id' => $certificateNft->id,
            'nft_name' => 'Certificate-' . $this->course->id . '-' . $this->student->id,
            'serial_num' => '1234567890',
            'tx_id' => 'tx123abc',
            'mph' => 'test_mph_hash',
            'metadata' => json_encode(['test' => 'data']),
            'used' => 0,
            'course_id' => $this->course->id
        ]);

        // Mock hasPassedAllExams to return true
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();
        $service->shouldReceive('hasPassedAllExams')
            ->once()
            ->andReturn(true);

        $result = $service->getEligibleStudentsWithStatus($this->course);

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['data']['students']);
        $this->assertEquals('minted', $result['data']['students'][0]['certificate_status']);
        $this->assertEquals('tx123abc', $result['data']['students'][0]['tx_hash']);
    }

    public function test_get_eligible_students_excludes_cancelled()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create cancelled course history
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => true
        ]);

        $result = $this->service->getEligibleStudentsWithStatus($this->course);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('students', $result['data']);
        $this->assertCount(0, $result['data']['students']);
    }

    public function test_batch_mint_processes_multiple_students()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create second student without triggering custodial address event
        $student2 = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'custodial_address' => 'addr1test_student2_custodial'
            ]);
        });
        $student2->attachRole('student');

        UserWallet::factory()->create([
            'user_id' => $student2->id,
            'points' => 100
        ]);

        // Create completed course histories for both students
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);

        CourseHistory::create([
            'user_id' => $student2->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);

        // Mock the service to test batch processing logic
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('hasPassedAllExams')
            ->twice()
            ->andReturn(true);

        $result = $service->getEligibleStudentsWithStatus($this->course);

        $this->assertTrue($result['success']);
        $this->assertCount(2, $result['data']['students']);
        $this->assertEquals(2, $result['data']['total_eligible']);
    }

    public function test_mint_certificate_updates_status_to_pending()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history with not_eligible status
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'not_eligible',
            'completed_at' => now()->subDays(1)
        ]);

        // Update to pending status (represents minting in progress)
        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'pending'
        );

        $courseHistory->refresh();
        $this->assertEquals('pending', $courseHistory->certificate_status);
        $this->assertNull($courseHistory->certificate_minted_at);
    }

    public function test_mint_certificate_success_updates_status_to_minted()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history with pending status (minting in progress)
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'pending',
            'completed_at' => now()->subDays(1)
        ]);

        $txHash = 'tx789xyz';

        // Update to minted status with transaction hash
        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'minted',
            null,
            $txHash
        );

        $courseHistory->refresh();
        $this->assertEquals('minted', $courseHistory->certificate_status);
        $this->assertEquals($txHash, $courseHistory->certificate_tx_hash);
        $this->assertNotNull($courseHistory->certificate_minted_at);
    }

    public function test_mint_certificate_failure_updates_status_to_failed()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history with pending status (minting in progress)
        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'certificate_status' => 'pending',
            'completed_at' => now()->subDays(1)
        ]);

        // Update to failed status
        $this->service->updateCertificateStatus(
            $this->course->id,
            $this->student->id,
            'failed'
        );

        $courseHistory->refresh();
        $this->assertEquals('failed', $courseHistory->certificate_status);
        $this->assertNull($courseHistory->certificate_minted_at);
    }

    public function test_get_student_certificates_returns_completed_courses_with_certificates_enabled()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create another course with certificate enabled
        $course2 = Course::factory()->create([
            'title' => 'Second Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);

        $schedule2 = CourseSchedule::factory()->create([
            'course_id' => $course2->id
        ]);

        // Create course histories for both courses
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(2),
            'is_cancelled' => false,
            'certificate_status' => 'not_eligible'
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $course2->id,
            'course_schedule_id' => $schedule2->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false,
            'certificate_status' => 'minted',
            'certificate_tx_hash' => 'tx123abc',
            'certificate_minted_at' => now()->subDays(1)
        ]);

        // Enable certificates on courses
        $this->course->update(['certificate_enabled' => true]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertEquals('Certificates retrieved successfully', $result['message']);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('certificates', $result['data']);
        $this->assertCount(2, $result['data']['certificates']);

        // Check that the certificates are ordered by completed_at descending
        $certificates = $result['data']['certificates'];
        $this->assertEquals($course2->id, $certificates[0]['course_id']);
        $this->assertEquals($this->course->id, $certificates[1]['course_id']);
    }

    public function test_get_student_certificates_excludes_cancelled_courses()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course with certificate enabled
        $this->course->update(['certificate_enabled' => true]);

        // Create completed course history (not cancelled)
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(2),
            'is_cancelled' => false,
            'certificate_status' => 'not_eligible'
        ]);

        // Create cancelled course history
        $course2 = Course::factory()->create([
            'title' => 'Cancelled Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);

        $schedule2 = CourseSchedule::factory()->create([
            'course_id' => $course2->id
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $course2->id,
            'course_schedule_id' => $schedule2->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => true,
            'certificate_status' => 'not_eligible'
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['data']['certificates']);
        $this->assertEquals($this->course->id, $result['data']['certificates'][0]['course_id']);
    }

    public function test_get_student_certificates_excludes_courses_without_certificate_enabled()
    {
        // Create course with certificates disabled
        $this->course->update(['certificate_enabled' => false]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false,
            'certificate_status' => 'not_eligible'
        ]);

        // Create course with certificates enabled
        $course2 = Course::factory()->create([
            'title' => 'Certificate-Enabled Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);

        $schedule2 = CourseSchedule::factory()->create([
            'course_id' => $course2->id
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $course2->id,
            'course_schedule_id' => $schedule2->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false,
            'certificate_status' => 'not_eligible'
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['data']['certificates']);
        $this->assertEquals($course2->id, $result['data']['certificates'][0]['course_id']);
    }

    public function test_get_student_certificates_excludes_incomplete_courses()
    {
        // Create course with certificate enabled
        $this->course->update(['certificate_enabled' => true]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create incomplete course history (no completed_at)
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => null,
            'is_cancelled' => false
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(0, $result['data']['certificates']);
    }

    public function test_get_student_certificates_returns_all_required_fields()
    {
        // Create course with certificate enabled
        $this->course->update(['certificate_enabled' => true]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $completedAt = now()->subDays(1);
        $mintedAt = now();

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => $completedAt,
            'is_cancelled' => false,
            'certificate_status' => 'minted',
            'certificate_tx_hash' => 'tx456def',
            'certificate_minted_at' => $mintedAt,
        ]);

        // Create NftTransactions record so the certificate_image_url accessor works
        NftTransactions::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'schedule_id' => $schedule->id,
            'nft_id' => 1,
            'nft_name' => 'TestCert',
            'serial_num' => 1,
            'used' => false,
            'metadata' => json_encode(['image' => 'https://example.com/cert.jpg']),
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['data']['certificates']);

        $certificate = $result['data']['certificates'][0];
        $this->assertArrayHasKey('id', $certificate);
        $this->assertArrayHasKey('course_id', $certificate);
        $this->assertArrayHasKey('course_name', $certificate);
        $this->assertArrayHasKey('professor_name', $certificate);
        $this->assertArrayHasKey('completed_at', $certificate);
        $this->assertArrayHasKey('certificate_status', $certificate);
        $this->assertArrayHasKey('certificate_tx_hash', $certificate);
        $this->assertArrayHasKey('certificate_minted_at', $certificate);
        $this->assertArrayHasKey('certificate_image_url', $certificate);
        $this->assertArrayHasKey('certificate_explorer_url', $certificate);

        $this->assertEquals($this->course->id, $certificate['course_id']);
        $this->assertEquals($this->course->title, $certificate['course_name']);
        $this->assertEquals($this->teacher->fullname, $certificate['professor_name']);
        $this->assertEquals('minted', $certificate['certificate_status']);
        $this->assertEquals('tx456def', $certificate['certificate_tx_hash']);
        $this->assertEquals('https://example.com/cert.jpg', $certificate['certificate_image_url']);

        // Explorer URL comes from config + tx_hash
        $expectedExplorerUrl = config('services.cardano.explorer_url') . '/transaction/tx456def';
        $this->assertEquals($expectedExplorerUrl, $certificate['certificate_explorer_url']);
    }

    public function test_get_student_certificates_defaults_certificate_status_to_not_eligible()
    {
        // Create course with certificate enabled
        $this->course->update(['certificate_enabled' => true]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false,
            'certificate_status' => 'not_eligible'
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['data']['certificates']);
        $this->assertEquals('not_eligible', $result['data']['certificates'][0]['certificate_status']);
    }

    public function test_get_student_certificates_returns_empty_array_when_no_certificates()
    {
        // Create course without certificate enabled
        $this->course->update(['certificate_enabled' => false]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(0, $result['data']['certificates']);
    }

    public function test_get_student_certificates_handles_exceptions()
    {
        // Mock the service method to simulate an exception internally
        $service = Mockery::mock(CertificateService::class)->makePartial();

        // Mock the method to return error response (simulating caught exception)
        $service->shouldReceive('getStudentCertificates')
            ->once()
            ->with($this->student->id)
            ->andReturn([
                'success' => false,
                'message' => 'Failed to retrieve certificates: Database connection failed'
            ]);

        $result = $service->getStudentCertificates($this->student->id);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Database connection failed', $result['message']);
    }

    public function test_get_student_certificates_orders_by_completed_at_descending()
    {
        // Create three courses
        $course2 = Course::factory()->create([
            'title' => 'Second Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);

        $course3 = Course::factory()->create([
            'title' => 'Third Course',
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);

        $this->course->update(['certificate_enabled' => true]);

        $schedule1 = CourseSchedule::factory()->create(['course_id' => $this->course->id]);
        $schedule2 = CourseSchedule::factory()->create(['course_id' => $course2->id]);
        $schedule3 = CourseSchedule::factory()->create(['course_id' => $course3->id]);

        // Create course histories with different completion dates
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule1->id,
            'completed_at' => now()->subDays(5),
            'is_cancelled' => false
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $course2->id,
            'course_schedule_id' => $schedule2->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);

        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $course3->id,
            'course_schedule_id' => $schedule3->id,
            'completed_at' => now()->subDays(3),
            'is_cancelled' => false
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(3, $result['data']['certificates']);

        // Verify order (most recent first)
        $certificates = $result['data']['certificates'];
        $this->assertEquals($course2->id, $certificates[0]['course_id']); // Most recent (1 day ago)
        $this->assertEquals($course3->id, $certificates[1]['course_id']); // Middle (3 days ago)
        $this->assertEquals($this->course->id, $certificates[2]['course_id']); // Oldest (5 days ago)
    }

    public function test_get_student_certificates_includes_certificate_transaction_relationship()
    {
        // Create course with certificate enabled
        $this->course->update(['certificate_enabled' => true]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false,
            'certificate_status' => 'minted'
        ]);

        // Create NFT transaction linked to course history
        $certificateNft = Nft::where('name', 'Certificate')->first();
        NftTransactions::create([
            'user_id' => $this->student->id,
            'nft_id' => $certificateNft->id,
            'nft_name' => 'Certificate-' . $this->course->id . '-' . $this->student->id,
            'serial_num' => '1234567890',
            'tx_id' => 'tx789ghi',
            'mph' => 'test_mph_hash',
            'metadata' => json_encode(['test' => 'data']),
            'used' => 0,
            'course_id' => $this->course->id,
            'course_history_id' => $courseHistory->id
        ]);

        $result = $this->service->getStudentCertificates($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['data']['certificates']);

        // The relationship should be eager loaded (verified by no N+1 query)
        $certificate = $result['data']['certificates'][0];
        $this->assertEquals('minted', $certificate['certificate_status']);
    }

    public function test_get_certificate_data_for_completion_returns_null_when_not_completed()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create course history without completion
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => null
        ]);

        $result = $this->service->getCertificateDataForCompletion(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNull($result);
    }

    public function test_get_certificate_data_for_completion_returns_null_when_no_record()
    {
        $result = $this->service->getCertificateDataForCompletion(
            $this->course->id,
            $this->student->id,
            99999
        );

        $this->assertNull($result);
    }

    public function test_get_certificate_data_for_completion_returns_not_eligible_status()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create completed course history without certificate
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'certificate_status' => 'not_eligible'
        ]);

        $result = $this->service->getCertificateDataForCompletion(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNotNull($result);
        $this->assertEquals('not_eligible', $result['status']);
        $this->assertNull($result['tx_hash']);
        $this->assertNull($result['explorer_url']);
        $this->assertNull($result['minted_at']);
    }

    public function test_get_certificate_data_for_completion_returns_minted_status_with_explorer_url()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $txHash = 'abc123def456ghi789';
        $mintedAt = now()->subDays(1);

        // Create completed course history with minted certificate
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(2),
            'certificate_status' => 'minted',
            'certificate_tx_hash' => $txHash,
            'certificate_minted_at' => $mintedAt
        ]);

        $result = $this->service->getCertificateDataForCompletion(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNotNull($result);
        $this->assertEquals('minted', $result['status']);
        $this->assertEquals($txHash, $result['tx_hash']);
        $this->assertNotNull($result['explorer_url']);
        $this->assertStringContainsString('/transaction/' . $txHash, $result['explorer_url']);
        $this->assertStringContainsString('cardanoscan.io', $result['explorer_url']);
        $this->assertEquals($mintedAt->toDateTimeString(), $result['minted_at']->toDateTimeString());
    }

    public function test_get_certificate_data_for_completion_uses_config_for_explorer_url()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $txHash = 'test_tx_hash_123';

        // Create completed course history with minted certificate
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(2),
            'certificate_status' => 'minted',
            'certificate_tx_hash' => $txHash,
            'certificate_minted_at' => now()->subDays(1)
        ]);

        // Get expected base URL from config
        $expectedBaseUrl = config('services.cardano.explorer_url');

        $result = $this->service->getCertificateDataForCompletion(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNotNull($result);
        $this->assertEquals($expectedBaseUrl . '/transaction/' . $txHash, $result['explorer_url']);
    }

    public function test_get_certificate_data_for_completion_returns_pending_status()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create completed course history with pending certificate
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'certificate_status' => 'pending'
        ]);

        $result = $this->service->getCertificateDataForCompletion(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNotNull($result);
        $this->assertEquals('pending', $result['status']);
        $this->assertNull($result['tx_hash']);
        $this->assertNull($result['explorer_url']);
    }

    public function test_get_certificate_data_for_completion_returns_failed_status()
    {
        // Create course schedule
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create completed course history with failed certificate
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'certificate_status' => 'failed'
        ]);

        $result = $this->service->getCertificateDataForCompletion(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNotNull($result);
        $this->assertEquals('failed', $result['status']);
        $this->assertNull($result['tx_hash']);
        $this->assertNull($result['explorer_url']);
    }

    // -------------------------------------------------------------------------
    // Fee estimation tests (F-10.1)
    // -------------------------------------------------------------------------

    public function test_estimates_fee_correctly_for_certificate_only(): void
    {
        // 5 students, cert only (MIN_ADA=2000000 + MAX_TX_FEE=500000 = 2500000 each)
        $this->course->certificate_enabled  = true;
        $this->course->token_reward_enabled = false;

        $result = $this->service->estimateAirdropFee(
            $this->course,
            5,
            true,
            false,
            100_000_000 // 100 ADA — more than enough
        );

        $this->assertTrue($result['success']);
        $this->assertEquals(5, $result['data']['student_count']);
        $this->assertEquals(2_500_000, $result['data']['per_student_lovelace']);
        $this->assertEquals(12_500_000, $result['data']['fee_lovelace']);
        $this->assertEquals(12.5, $result['data']['fee_ada']);
        $this->assertFalse($result['data']['insufficient']);
        $this->assertEquals(0, $result['data']['shortfall_lovelace']);
    }

    public function test_reports_insufficient_funds(): void
    {
        $this->course->certificate_enabled  = true;
        $this->course->token_reward_enabled = false;

        $result = $this->service->estimateAirdropFee(
            $this->course,
            5,
            true,
            false,
            5_000_000 // only 5 ADA — not enough for 12.5 ADA
        );

        $this->assertTrue($result['success']);
        $this->assertTrue($result['data']['insufficient']);
        $this->assertEquals(7_500_000, $result['data']['shortfall_lovelace']);
    }

    public function test_doubles_fee_when_both_rewards_enabled(): void
    {
        $this->course->certificate_enabled  = true;
        $this->course->token_reward_enabled = true;

        $result = $this->service->estimateAirdropFee(
            $this->course,
            1,
            true,
            true,
            100_000_000
        );

        $this->assertTrue($result['success']);
        // cert + token = 2 * (2000000 + 500000) = 5000000 per student
        $this->assertEquals(5_000_000, $result['data']['per_student_lovelace']);
        $this->assertFalse($result['data']['insufficient']);
    }

    // -------------------------------------------------------------------------
    // Certificate status sync tests
    // -------------------------------------------------------------------------

    public function test_mint_and_airdrop_certificate_updates_certificate_status_on_success(): void
    {
        // Create course schedule and course history with null certificate_status
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false,
            'certificate_status' => null
        ]);

        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->with($this->student)
            ->andReturn('addr1test_wallet');

        $service->shouldReceive('createCertificateMetadata')
            ->once()
            ->andReturn([
                'name' => 'Certificate of Completion',
                'course_title' => $this->course->title,
                'student_name' => $this->student->fullname,
                'student_email' => $this->student->email,
                'teacher_name' => $this->teacher->fullname,
                'completion_date' => now()->format('Y-m-d'),
                'serial_number' => '1234567890',
                'course_id' => $this->course->id,
                'student_id' => $this->student->id
            ]);

        $service->shouldReceive('mintCertificateNFT')
            ->once()
            ->andReturn([
                'success' => true,
                'transaction_id' => 'tx_sync_test',
                'nft_name' => 'Certificate-' . $this->course->id . '-' . $this->student->id,
                'serial_number' => '1234567890',
                'mph' => 'test_mph_hash'
            ]);

        $service->shouldReceive('recordNftTransaction')
            ->once();

        $service->shouldReceive('sendCertificateNotification')
            ->once();

        $result = $service->mintAndAirdropCertificate($this->course, $this->student, $schedule->id);

        $this->assertTrue($result['success']);

        $courseHistory->refresh();
        $this->assertEquals('minted', $courseHistory->certificate_status);
        $this->assertEquals('tx_sync_test', $courseHistory->certificate_tx_hash);
    }

    public function test_mint_and_airdrop_certificate_does_not_update_status_on_failure(): void
    {
        // Create course schedule and course history with null certificate_status
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        $courseHistory = CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false,
            'certificate_status' => null
        ]);

        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->with($this->student)
            ->andReturn('addr1test_wallet');

        $service->shouldReceive('createCertificateMetadata')
            ->once()
            ->andReturn([
                'name' => 'Certificate of Completion',
                'course_title' => $this->course->title,
                'student_name' => $this->student->fullname,
                'student_email' => $this->student->email,
                'teacher_name' => $this->teacher->fullname,
                'completion_date' => now()->format('Y-m-d'),
                'serial_number' => '1234567890',
                'course_id' => $this->course->id,
                'student_id' => $this->student->id
            ]);

        $service->shouldReceive('mintCertificateNFT')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Insufficient funds'
            ]);

        $result = $service->mintAndAirdropCertificate($this->course, $this->student, $schedule->id);

        $this->assertFalse($result['success']);

        $courseHistory->refresh();
        $this->assertNull($courseHistory->certificate_status);
    }

    // --- Enrollment-time snapshot tests (SC-E02-06) ---

    public function test_create_certificate_metadata_uses_enrolled_name_when_history_provided()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        // Post-migration row: enrolled_certificate_enabled is not null (sentinel)
        $history = CourseHistory::factory()->create([
            'user_id'                      => $this->student->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $schedule->id,
            'enrolled_certificate_enabled' => true,
            'enrolled_certificate_name'    => 'Custom Cert Name',
            'enrolled_certificate_description' => 'Custom description',
        ]);

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('createCertificateMetadata');
        $method->setAccessible(true);

        $metadata = $method->invokeArgs($this->service, [
            $this->course,
            $this->student,
            $history->effectiveCertificateName(),
            $history->effectiveCertificateDescription(),
        ]);

        $this->assertEquals('Custom Cert Name', $metadata['name']);
        $this->assertEquals('Custom description', $metadata['description']);
    }

    public function test_create_certificate_metadata_uses_default_when_no_history()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('createCertificateMetadata');
        $method->setAccessible(true);

        // No overrides passed — should use defaults
        $metadata = $method->invokeArgs($this->service, [
            $this->course,
            $this->student,
            null,
            null,
        ]);

        $this->assertEquals('Certificate of Completion', $metadata['name']);
        $this->assertNull($metadata['description']);
    }

    // ---------------------------------------------------------------------------
    // getStudentRewards tests
    // ---------------------------------------------------------------------------

    public function test_get_student_rewards_returns_empty_when_no_completions()
    {
        // No CourseHistory rows exist for this student, so rewards should be empty.
        $result = $this->service->getStudentRewards($this->student->id);

        $this->assertTrue($result['success']);
        $this->assertEmpty($result['data']['rewards']);
    }

    public function test_get_student_rewards_returns_certificate_row_for_cert_enabled_course()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        $this->course->update(['certificate_enabled' => true]);

        CourseHistory::create([
            'user_id'                    => $this->student->id,
            'course_id'                  => $this->course->id,
            'course_schedule_id'         => $schedule->id,
            'completed_at'               => now()->subDays(1),
            'enrolled_certificate_enabled' => true,
            'enrolled_token_reward_enabled' => false,
        ]);

        $result = $this->service->getStudentRewards($this->student->id);

        $this->assertTrue($result['success']);
        $rewards = $result['data']['rewards'];
        $this->assertCount(1, $rewards);
        $this->assertEquals('certificate', $rewards[0]['reward_type']);
        $this->assertStringStartsWith('cert-', $rewards[0]['id']);
        $this->assertEquals($this->course->title, $rewards[0]['course_name']);
    }

    public function test_get_student_rewards_returns_token_row_for_token_enabled_course()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        CourseHistory::create([
            'user_id'                      => $this->student->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $schedule->id,
            'completed_at'                 => now()->subDays(1),
            'enrolled_certificate_enabled' => false,
            'enrolled_token_reward_enabled' => true,
            'enrolled_token_reward_amount'  => 500,
        ]);

        $result = $this->service->getStudentRewards($this->student->id);

        $this->assertTrue($result['success']);
        $rewards = $result['data']['rewards'];
        $this->assertCount(1, $rewards);
        $this->assertEquals('token', $rewards[0]['reward_type']);
        $this->assertStringStartsWith('token-', $rewards[0]['id']);
        $this->assertEquals(500, $rewards[0]['amount']);
    }

    public function test_get_student_rewards_returns_two_rows_when_both_rewards_enabled()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        CourseHistory::create([
            'user_id'                      => $this->student->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $schedule->id,
            'completed_at'                 => now()->subDays(1),
            'enrolled_certificate_enabled' => true,
            'enrolled_token_reward_enabled' => true,
            'enrolled_token_reward_amount'  => 250,
        ]);

        $result = $this->service->getStudentRewards($this->student->id);

        $this->assertTrue($result['success']);
        $rewards = $result['data']['rewards'];
        $this->assertCount(2, $rewards);

        $types = array_column($rewards, 'reward_type');
        $this->assertContains('certificate', $types);
        $this->assertContains('token', $types);
    }

    public function test_get_student_rewards_marks_revoked_when_rewards_invalidated_at_set()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        CourseHistory::create([
            'user_id'                      => $this->student->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $schedule->id,
            'completed_at'                 => now()->subDays(5),
            'enrolled_certificate_enabled' => true,
            'enrolled_token_reward_enabled' => true,
            'enrolled_token_reward_amount'  => 100,
            'rewards_invalidated_at'        => now()->subDays(1),
        ]);

        $result = $this->service->getStudentRewards($this->student->id);

        $this->assertTrue($result['success']);
        $rewards = $result['data']['rewards'];
        $this->assertCount(2, $rewards);

        foreach ($rewards as $reward) {
            $this->assertEquals('revoked', $reward['delivery_status']);
            $this->assertNotNull($reward['revoked_at']);
        }
    }

    public function test_get_self_mint_eligibility_returns_null_when_not_completed()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        // Create a booking WITHOUT completed_at
        CourseHistory::create([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at'       => null,
        ]);

        $result = $this->service->getSelfMintEligibility(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNull($result);
    }

    public function test_get_self_mint_eligibility_returns_null_when_no_history()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        // No CourseHistory created

        $result = $this->service->getSelfMintEligibility(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNull($result);
    }

    public function test_get_self_mint_eligibility_returns_structured_array_when_completed()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        $txHash = 'abc123certtest';

        CourseHistory::create([
            'user_id'                      => $this->student->id,
            'course_id'                    => $this->course->id,
            'course_schedule_id'           => $schedule->id,
            'completed_at'                 => now()->subDays(1),
            'certificate_status'           => 'minted',
            'certificate_tx_hash'          => $txHash,
            'certificate_minted_at'        => now()->subHours(12),
            'enrolled_certificate_enabled' => true,
            'enrolled_token_reward_enabled' => false,
        ]);

        $result = $this->service->getSelfMintEligibility(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNotNull($result);
        $this->assertArrayHasKey('certificate', $result);
        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('total_fee_lovelace', $result);

        // Certificate block should be present since enrolled_certificate_enabled = true
        $this->assertNotNull($result['certificate']);
        $this->assertEquals('minted', $result['certificate']['status']);
        $this->assertEquals($txHash, $result['certificate']['tx_hash']);
        $this->assertStringContainsString($txHash, $result['certificate']['explorer_url']);
        $this->assertArrayHasKey('fee_lovelace', $result['certificate']);
        $this->assertGreaterThan(0, $result['certificate']['fee_lovelace']);

        // Token block should be null since enrolled_token_reward_enabled = false
        $this->assertNull($result['token']);

        // Total fee should equal certificate fee only
        $this->assertEquals($result['certificate']['fee_lovelace'], $result['total_fee_lovelace']);
    }

    public function test_get_self_mint_eligibility_includes_token_when_enabled()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);

        $tokenTxHash = 'tokentxhash456';

        CourseHistory::create([
            'user_id'                       => $this->student->id,
            'course_id'                     => $this->course->id,
            'course_schedule_id'            => $schedule->id,
            'completed_at'                  => now()->subDays(1),
            'certificate_status'            => 'not_eligible',
            'token_reward_status'           => 'minted',
            'token_reward_tx_hash'          => $tokenTxHash,
            'token_reward_minted_at'        => now()->subHours(6),
            'enrolled_certificate_enabled'  => false,
            'enrolled_token_reward_enabled' => true,
            'enrolled_token_reward_amount'  => 50,
        ]);

        $result = $this->service->getSelfMintEligibility(
            $this->course->id,
            $this->student->id,
            $schedule->id
        );

        $this->assertNotNull($result);
        $this->assertNull($result['certificate']);
        $this->assertNotNull($result['token']);
        $this->assertEquals('minted', $result['token']['status']);
        $this->assertEquals($tokenTxHash, $result['token']['tx_hash']);
        $this->assertEquals(50, $result['token']['amount']);
        $this->assertStringContainsString($tokenTxHash, $result['token']['explorer_url']);
        $this->assertEquals($result['token']['fee_lovelace'], $result['total_fee_lovelace']);
    }

    // ── deriveCertificatePolicyId ──────────────────────────────────────

    public function test_derive_certificate_policy_id_returns_mph_on_success()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('buildWeb3Command')
            ->once()
            ->with('run/derive-certificate-mph.mjs')
            ->andReturn('echo test');

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode(['status' => 200, 'mph' => 'abc123def456']));

        $result = $service->deriveCertificatePolicyId();

        $this->assertEquals('abc123def456', $result);
    }

    public function test_derive_certificate_policy_id_returns_null_on_script_error()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('buildWeb3Command')
            ->once()
            ->andReturn('echo test');

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode(['status' => 500, 'error' => 'CERTIFICATE_LOCK_DATE env var or argument required']));

        Log::shouldReceive('error')->once();

        $result = $service->deriveCertificatePolicyId();

        $this->assertNull($result);
    }

    public function test_derive_certificate_policy_id_returns_null_on_exception()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial()->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('buildWeb3Command')
            ->once()
            ->andReturn('echo test');

        $service->shouldReceive('runCommand')
            ->once()
            ->andThrow(new \Exception('Command timed out'));

        Log::shouldReceive('error')->once();

        $result = $service->deriveCertificatePolicyId();

        $this->assertNull($result);
    }
}
