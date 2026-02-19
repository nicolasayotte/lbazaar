<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\WithFaker;
use App\Services\API\CoursePurchaseService;
use App\Services\API\WalletService;
use App\Repositories\UserRepository;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\UserWallet;
use App\Models\WalletTransactionHistory;
use App\Models\Role;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Mockery;

class CoursePurchaseServiceTest extends TestCase
{
    use DatabaseTransactions, WithFaker;

    protected $service;
    protected $walletService;
    protected $userRepository;
    protected $teacher;
    protected $student;
    protected $admin;
    protected $course;
    protected $schedule;
    protected $userWallet;
    protected $teacherWallet;
    protected $adminWallet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setupTestData();

        // Use mock userRepository so we control getAdmin() behavior
        $this->walletService = new WalletService();
        $this->userRepository = Mockery::mock(UserRepository::class);
        $this->userRepository->shouldReceive('getAdmin')->andReturn($this->admin)->byDefault();

        $this->service = new CoursePurchaseService($this->walletService, $this->userRepository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function setupTestData()
    {
        // Ensure roles exist
        $this->createRoles(['administrator', 'teacher', 'student']);

        // Create admin without triggering custodial address event
        $this->admin = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'purchase-admin@example.com',
                'custodial_address' => 'addr1test_admin_custodial'
            ]);
        });
        $this->admin->attachRole('administrator');

        // Create teacher
        $this->teacher = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'John',
                'last_name' => 'Teacher',
                'custodial_address' => 'addr1test_teacher_custodial'
            ]);
        });
        $this->teacher->attachRole('teacher');

        // Create student
        $this->student = User::withoutEvents(function () {
            return User::factory()->create([
                'first_name' => 'Jane',
                'last_name' => 'Student',
                'email' => 'purchase-student@example.com',
                'custodial_address' => 'addr1test_student_custodial'
            ]);
        });
        $this->student->attachRole('student');

        // Create wallets
        $this->userWallet = UserWallet::factory()->create([
            'user_id' => $this->student->id,
            'points' => 100,
            'stake_key_hash' => 'abc123def456',
            'address' => 'addr1student_wallet_address'
        ]);

        $this->teacherWallet = UserWallet::factory()->create([
            'user_id' => $this->teacher->id,
            'points' => 50,
            'address' => 'addr1teacher_wallet_address'
        ]);

        $this->adminWallet = UserWallet::factory()->create([
            'user_id' => $this->admin->id,
            'points' => 1000,
            'address' => 'addr1admin_wallet_address'
        ]);

        // Create course
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id,
            'price' => 1000
        ]);

        // Create schedule
        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id
        ]);

        // Create settings — delete first so parallel test processes
        // don't contend on the same committed row via updateOrCreate
        Setting::where('slug', 'ada-to-jpy')->delete();
        Setting::create([
            'slug' => 'ada-to-jpy',
            'name' => 'ADA to JPY Exchange Rate',
            'value' => '50',
            'type' => 'number',
            'category' => 'general',
        ]);
        Setting::where('slug', 'admin-commission')->delete();
        Setting::create([
            'slug' => 'admin-commission',
            'name' => 'Admin Commission',
            'value' => '20',
            'type' => 'number',
            'category' => 'general',
        ]);
    }

    // --- convertJpyToAda tests ---

    public function test_converts_jpy_to_ada_correctly()
    {
        // 1000 JPY / 50 rate = 20 ADA
        $adaAmount = $this->service->convertJpyToAda(1000);
        $this->assertEquals(20.0, $adaAmount);
    }

    public function test_converts_larger_jpy_amount()
    {
        // 5000 JPY / 50 rate = 100 ADA
        $adaAmount = $this->service->convertJpyToAda(5000);
        $this->assertEquals(100.0, $adaAmount);
    }

    public function test_throws_exception_when_exchange_rate_not_configured()
    {
        Setting::where('slug', 'ada-to-jpy')->delete();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('ADA to JPY conversion rate not configured');

        $this->service->convertJpyToAda(1000);
    }

    public function test_conversion_rounds_to_six_decimals()
    {
        // 1234.56 / 50 = 24.6912
        $adaAmount = $this->service->convertJpyToAda(1234.56);
        $this->assertEquals(24.6912, $adaAmount);

        $decimalParts = explode('.', (string) $adaAmount);
        if (isset($decimalParts[1])) {
            $this->assertLessThanOrEqual(6, strlen($decimalParts[1]));
        }
    }

    // --- buildPurchaseTransaction tests ---

    public function test_build_fails_without_connected_wallet()
    {
        // Create student without wallet
        $noWalletStudent = User::withoutEvents(function () {
            return User::factory()->create(['custodial_address' => 'addr1test_nowallet']);
        });

        $result = $this->service->buildPurchaseTransaction($this->schedule, $noWalletStudent);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('User wallet not connected', $result['message']);
    }

    public function test_build_fails_without_stake_key_hash()
    {
        // Remove stake key hash
        $this->userWallet->update(['stake_key_hash' => null]);

        $result = $this->service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('User wallet not connected', $result['message']);
    }

    public function test_build_fails_without_teacher_wallet()
    {
        $this->teacherWallet->delete();

        $result = $this->service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('System wallets not configured', $result['message']);
    }

    public function test_build_fails_without_admin_wallet()
    {
        $this->adminWallet->delete();

        $result = $this->service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('System wallets not configured', $result['message']);
    }

    public function test_builds_purchase_transaction_successfully()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 200,
                'cborTx' => 'test_cbor_tx_data',
                'teacherAmount' => 16.0,
                'adminAmount' => 4.0
            ]));

        request()->merge(['cborUtxos' => 'test_cbor_utxos']);

        $result = $service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertTrue($result['success']);
        $this->assertEquals('Transaction built successfully', $result['message']);
        $this->assertEquals('test_cbor_tx_data', $result['data']['cborTx']);
        $this->assertEquals(20.0, $result['data']['adaAmount']);
        $this->assertEquals(16.0, $result['data']['teacherAmount']);
        $this->assertEquals(4.0, $result['data']['adminAmount']);
    }

    public function test_build_returns_insufficient_funds_flag()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 501,
                'error' => 'Insufficient ADA balance'
            ]));

        request()->merge(['cborUtxos' => 'test_cbor_utxos']);

        $result = $service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertFalse($result['success']);
        $this->assertTrue($result['insufficientFunds']);
        $this->assertStringContainsString('Insufficient ADA balance', $result['message']);
    }

    public function test_build_returns_web3_error()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 500,
                'error' => 'Network error'
            ]));

        request()->merge(['cborUtxos' => 'test_cbor_utxos']);

        $result = $service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertFalse($result['success']);
        $this->assertFalse($result['insufficientFunds'] ?? false);
        $this->assertStringContainsString('Network error', $result['message']);
    }

    public function test_build_uses_correct_commission_setting()
    {
        Setting::where('slug', 'admin-commission')->update(['value' => '30']);

        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $capturedCommand = null;
        $service->shouldReceive('runCommand')
            ->once()
            ->with(Mockery::on(function ($cmd) use (&$capturedCommand) {
                $capturedCommand = $cmd;
                return true;
            }))
            ->andReturn(json_encode([
                'status' => 200,
                'cborTx' => 'test_cbor_tx_data',
                'teacherAmount' => 14.0,
                'adminAmount' => 6.0
            ]));

        request()->merge(['cborUtxos' => 'test_cbor_utxos']);

        $result = $service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString("'30'", $capturedCommand);
    }

    public function test_build_defaults_commission_when_not_configured()
    {
        Setting::where('slug', 'admin-commission')->delete();

        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $capturedCommand = null;
        $service->shouldReceive('runCommand')
            ->once()
            ->with(Mockery::on(function ($cmd) use (&$capturedCommand) {
                $capturedCommand = $cmd;
                return true;
            }))
            ->andReturn(json_encode([
                'status' => 200,
                'cborTx' => 'test_cbor_tx_data',
                'teacherAmount' => 16.0,
                'adminAmount' => 4.0
            ]));

        request()->merge(['cborUtxos' => 'test_cbor_utxos']);

        $result = $service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertTrue($result['success']);
        // Default commission is 20%
        $this->assertStringContainsString("'20'", $capturedCommand);
    }

    // --- submitPurchaseTransaction tests ---

    public function test_submits_signed_transaction_successfully()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 200,
                'txId' => 'test_tx_hash_123',
                'teacherAmount' => 16.0,
                'adminAmount' => 4.0
            ]));

        $result = $service->submitPurchaseTransaction($this->schedule, $this->student, 'cbor_sig', 'cbor_tx');

        $this->assertTrue($result['success']);
        $this->assertEquals('Transaction submitted successfully. Waiting for blockchain confirmation.', $result['message']);
        $this->assertEquals('test_tx_hash_123', $result['data']['txId']);

        // Verify database records
        $this->assertDatabaseHas('course_histories', [
            'course_schedule_id' => $this->schedule->id,
            'course_id' => $this->course->id,
            'user_id' => $this->student->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'test_tx_hash_123'
        ]);

        $this->assertDatabaseHas('wallet_transaction_histories', [
            'user_wallet_id' => $this->userWallet->id,
            'type' => WalletTransactionHistory::PURCHASE,
            'tx_id' => 'test_tx_hash_123',
            'status' => 'pending'
        ]);
    }

    public function test_submit_returns_web3_error()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 500,
                'error' => 'Transaction submission failed'
            ]));

        $result = $service->submitPurchaseTransaction($this->schedule, $this->student, 'cbor_sig', 'cbor_tx');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Transaction submission failed', $result['message']);
    }

    public function test_submit_creates_wallet_transaction_with_course_history_reference()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 200,
                'txId' => 'tx_with_reference',
                'teacherAmount' => 16.0
            ]));

        $result = $service->submitPurchaseTransaction($this->schedule, $this->student, 'cbor_sig', 'cbor_tx');

        $this->assertTrue($result['success']);

        $walletTrans = WalletTransactionHistory::where('tx_id', 'tx_with_reference')->first();
        $this->assertNotNull($walletTrans);
        $this->assertNotNull($walletTrans->course_history_id);

        $courseHistory = CourseHistory::find($walletTrans->course_history_id);
        $this->assertNotNull($courseHistory);
        $this->assertEquals('tx_with_reference', $courseHistory->payment_tx_hash);
    }

    // --- confirmPurchaseTransaction tests ---

    public function test_confirms_purchase_via_webhook()
    {
        $courseHistory = CourseHistory::create([
            'course_schedule_id' => $this->schedule->id,
            'course_id' => $this->course->id,
            'user_id' => $this->student->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'pending_tx_hash',
            'payment_ada_amount' => 16.0,
            'payment_submitted_at' => now()
        ]);

        WalletTransactionHistory::create([
            'user_wallet_id' => $this->userWallet->id,
            'course_history_id' => $courseHistory->id,
            'type' => WalletTransactionHistory::PURCHASE,
            'points_before' => 100,
            'points_after' => 100,
            'tx_id' => 'pending_tx_hash',
            'status' => 'pending'
        ]);

        $result = $this->service->confirmPurchaseTransaction('pending_tx_hash');

        $this->assertTrue($result['success']);
        $this->assertEquals('Purchase confirmed successfully', $result['message']);

        $courseHistory->refresh();
        $this->assertEquals('confirmed', $courseHistory->payment_status);
        $this->assertNotNull($courseHistory->payment_confirmed_at);

        $walletTrans = WalletTransactionHistory::where('tx_id', 'pending_tx_hash')->first();
        $this->assertEquals('confirmed', $walletTrans->status);
    }

    public function test_confirm_ignores_already_confirmed()
    {
        CourseHistory::create([
            'course_schedule_id' => $this->schedule->id,
            'course_id' => $this->course->id,
            'user_id' => $this->student->id,
            'payment_status' => 'confirmed',
            'payment_tx_hash' => 'confirmed_tx_hash',
            'payment_ada_amount' => 16.0,
            'payment_submitted_at' => now()->subHours(2),
            'payment_confirmed_at' => now()->subHour()
        ]);

        $result = $this->service->confirmPurchaseTransaction('confirmed_tx_hash');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not found or already confirmed', $result['message']);
    }

    public function test_confirm_returns_not_found_for_nonexistent_tx()
    {
        $result = $this->service->confirmPurchaseTransaction('nonexistent_tx_hash');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not found or already confirmed', $result['message']);
    }

    public function test_confirm_is_idempotent()
    {
        $courseHistory = CourseHistory::create([
            'course_schedule_id' => $this->schedule->id,
            'course_id' => $this->course->id,
            'user_id' => $this->student->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'idempotent_tx_hash',
            'payment_ada_amount' => 16.0,
            'payment_submitted_at' => now()
        ]);

        WalletTransactionHistory::create([
            'user_wallet_id' => $this->userWallet->id,
            'course_history_id' => $courseHistory->id,
            'type' => WalletTransactionHistory::PURCHASE,
            'points_before' => 100,
            'points_after' => 100,
            'tx_id' => 'idempotent_tx_hash',
            'status' => 'pending'
        ]);

        // First confirmation succeeds
        $result1 = $this->service->confirmPurchaseTransaction('idempotent_tx_hash');
        $this->assertTrue($result1['success']);

        // Second confirmation fails gracefully (already confirmed)
        $result2 = $this->service->confirmPurchaseTransaction('idempotent_tx_hash');
        $this->assertFalse($result2['success']);
    }

    // --- buildWeb3Command tests ---

    public function test_build_web3_command_escapes_arguments()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('buildWeb3Command');
        $method->setAccessible(true);

        $command = $method->invokeArgs($this->service, [
            'run/build-purchase-tx.mjs',
            ['test_arg', "dangerous'arg", 'normal_arg']
        ]);

        $this->assertStringContainsString("'test_arg'", $command);
        $this->assertStringContainsString("'normal_arg'", $command);
        $this->assertStringContainsString('web3', $command);
        $this->assertStringContainsString('2>>', $command);
        $this->assertStringContainsString('web3.log', $command);
    }

    public function test_build_web3_command_no_arguments()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('buildWeb3Command');
        $method->setAccessible(true);

        $cmd = $method->invokeArgs($this->service, ['run/test-script.mjs', []]);

        $this->assertStringContainsString('test-script.mjs', $cmd);
        $this->assertStringContainsString('web3', $cmd);
    }

    // --- Exception handling tests ---

    public function test_build_catches_exceptions()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andThrow(new \Exception('Timeout'));

        request()->merge(['cborUtxos' => 'test']);

        $result = $service->buildPurchaseTransaction($this->schedule, $this->student);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Timeout', $result['message']);
    }

    public function test_submit_catches_exceptions()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andThrow(new \Exception('Connection refused'));

        $result = $service->submitPurchaseTransaction($this->schedule, $this->student, 'sig', 'tx');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Connection refused', $result['message']);
    }

    // --- getTxConfirmations tests ---

    public function test_get_tx_confirmations_returns_count()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 200,
                'confirmations' => 15,
                'txBlockHeight' => 100,
                'tipHeight' => 115
            ]));

        $result = $service->getTxConfirmations('some_tx_id');

        $this->assertEquals(15, $result);
    }

    public function test_get_tx_confirmations_throws_on_not_found()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 404,
                'error' => 'Transaction not found'
            ]));

        $this->expectException(\Exception::class);

        $service->getTxConfirmations('some_tx_id');
    }

    public function test_get_tx_confirmations_throws_on_script_error()
    {
        $service = Mockery::mock(CoursePurchaseService::class, [$this->walletService, $this->userRepository])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 500,
                'error' => 'Script failed'
            ]));

        $this->expectException(\Exception::class);

        $service->getTxConfirmations('some_tx_id');
    }

    // --- failPurchaseTransaction tests ---

    public function test_fail_purchase_transitions_to_failed_status()
    {
        $courseHistory = CourseHistory::create([
            'course_schedule_id' => $this->schedule->id,
            'course_id' => $this->course->id,
            'user_id' => $this->student->id,
            'payment_status' => 'pending',
            'payment_tx_hash' => 'test_tx',
            'payment_ada_amount' => 16.0,
            'payment_submitted_at' => now()
        ]);

        WalletTransactionHistory::create([
            'user_wallet_id' => $this->userWallet->id,
            'course_history_id' => $courseHistory->id,
            'type' => WalletTransactionHistory::PURCHASE,
            'points_before' => 100,
            'points_after' => 100,
            'tx_id' => 'test_tx',
            'status' => 'pending'
        ]);

        $result = $this->service->failPurchaseTransaction('test_tx');

        $this->assertTrue($result['success']);

        $courseHistory->refresh();
        $this->assertEquals('failed', $courseHistory->payment_status);

        $walletTrans = WalletTransactionHistory::where('tx_id', 'test_tx')->first();
        $this->assertEquals('failed', $walletTrans->status);
    }

    public function test_fail_purchase_is_idempotent()
    {
        $result = $this->service->failPurchaseTransaction('nonexistent_tx');

        $this->assertFalse($result['success']);
    }
}
