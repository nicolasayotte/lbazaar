<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\WithFaker;
use App\Services\API\CertificateService;
use App\Models\User;
use App\Models\Course;
use App\Models\UserWallet;
use App\Models\Nft;
use App\Models\NftTransactions;
use App\Models\Role;
use Illuminate\Support\Facades\Log;
use Mockery;

class CertificateServiceTest extends TestCase
{
    use DatabaseTransactions, WithFaker;

    protected $service;
    protected $teacher;
    protected $student;
    protected $course;
    protected $userWallet;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new CertificateService();
        $this->setupTestData();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function setupTestData()
    {
        // Create roles
        Role::firstOrCreate(['name' => 'teacher'], ['display_name' => 'Teacher']);
        Role::firstOrCreate(['name' => 'student'], ['display_name' => 'Student']);

        // Create teacher
        $this->teacher = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Teacher'
        ]);
        $this->teacher->attachRole('teacher');

        // Create student
        $this->student = User::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com'
        ]);
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
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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

    public function test_mint_certificate_nft_missing_template()
    {
        // Delete the certificate NFT template
        Nft::where('name', 'Certificate')->delete();

        $service = new CertificateService();
        
        $certificateData = [
            'course_id' => $this->course->id,
            'student_id' => $this->student->id,
            'serial_number' => '1234567890'
        ];

        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('mintCertificateNFT');
        $method->setAccessible(true);

        $result = $method->invokeArgs($service, [$certificateData, 'addr1test']);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Certificate NFT template not found', $result['message']);
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
    }

    public function test_mint_and_airdrop_certificate_handles_exceptions()
    {
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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
        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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

        $service = Mockery::mock(CertificateService::class)->makePartial();
        
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
}
