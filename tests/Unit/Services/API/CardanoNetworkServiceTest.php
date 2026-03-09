<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use App\Services\API\CardanoNetworkService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Mockery;

class CardanoNetworkServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function makeService(): \Mockery\MockInterface
    {
        return Mockery::mock(CardanoNetworkService::class)
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();
    }

    public function test_returns_healthy_when_script_reports_healthy(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 200,
                'networkStatus' => 'healthy',
                'latestBlock' => ['hash' => 'abc123', 'height' => 1000, 'time' => '2024-01-01T00:00:00.000Z'],
            ]));

        $result = $service->getNetworkStatus();

        $this->assertEquals('healthy', $result['status']);
        $this->assertEquals('2024-01-01T00:00:00.000Z', $result['lastBlockTime']);
    }

    public function test_returns_degraded_when_script_reports_degraded(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 200,
                'networkStatus' => 'degraded',
                'latestBlock' => ['hash' => 'def456', 'height' => 999, 'time' => '2024-01-01T00:00:00.000Z'],
            ]));

        $result = $service->getNetworkStatus();

        $this->assertEquals('degraded', $result['status']);
    }

    public function test_returns_unreachable_on_empty_output(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn('');

        $result = $service->getNetworkStatus();

        $this->assertEquals('unreachable', $result['status']);
        $this->assertNull($result['lastBlockTime']);
    }

    public function test_returns_unreachable_on_non_json_output(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn('not valid json at all');

        $result = $service->getNetworkStatus();

        $this->assertEquals('unreachable', $result['status']);
        $this->assertNull($result['lastBlockTime']);
    }

    public function test_returns_unreachable_when_script_returns_500(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode(['status' => 500, 'error' => 'Connection refused']));

        $result = $service->getNetworkStatus();

        $this->assertEquals('unreachable', $result['status']);
        $this->assertNull($result['lastBlockTime']);
    }

    public function test_caches_healthy_result_and_skips_second_call(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->once()
            ->andReturn(json_encode([
                'status' => 200,
                'networkStatus' => 'healthy',
                'latestBlock' => ['hash' => 'abc', 'height' => 100, 'time' => '2024-01-01T00:00:00.000Z'],
            ]));

        // First call — hits runCommand
        $result1 = $service->getNetworkStatus();
        // Second call — should use cache, not call runCommand again
        $result2 = $service->getNetworkStatus();

        $this->assertEquals('healthy', $result1['status']);
        $this->assertEquals('healthy', $result2['status']);
    }

    public function test_does_not_cache_degraded_result(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->twice()
            ->andReturn(json_encode([
                'status' => 200,
                'networkStatus' => 'degraded',
                'latestBlock' => ['hash' => 'def456', 'height' => 999, 'time' => '2024-01-01T00:00:00.000Z'],
            ]));

        $result1 = $service->getNetworkStatus();
        $result2 = $service->getNetworkStatus();

        $this->assertEquals('degraded', $result1['status']);
        $this->assertEquals('degraded', $result2['status']);
    }

    public function test_does_not_cache_unreachable_result(): void
    {
        $service = $this->makeService();
        $service->shouldReceive('runCommand')
            ->twice()
            ->andReturn('');

        // First call — returns unreachable (empty output)
        $result1 = $service->getNetworkStatus();
        // Second call — should NOT use cache, must call runCommand again
        $result2 = $service->getNetworkStatus();

        $this->assertEquals('unreachable', $result1['status']);
        $this->assertEquals('unreachable', $result2['status']);
    }
}
