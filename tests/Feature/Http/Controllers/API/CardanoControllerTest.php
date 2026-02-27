<?php

namespace Tests\Feature\Http\Controllers\API;

use Tests\TestCase;
use App\Services\API\CardanoNetworkService;

class CardanoControllerTest extends TestCase
{
    public function test_returns_healthy_status(): void
    {
        $this->mock(CardanoNetworkService::class, function ($mock) {
            $mock->shouldReceive('getNetworkStatus')
                ->once()
                ->andReturn(['status' => 'healthy', 'lastBlockTime' => '2024-01-01T00:00:00.000Z']);
        });

        $response = $this->getJson('/api/cardano/network-status');

        $response->assertStatus(200)
            ->assertJson(['status' => 'healthy', 'lastBlockTime' => '2024-01-01T00:00:00.000Z']);
    }

    public function test_returns_degraded_status(): void
    {
        $this->mock(CardanoNetworkService::class, function ($mock) {
            $mock->shouldReceive('getNetworkStatus')
                ->once()
                ->andReturn(['status' => 'degraded', 'lastBlockTime' => '2024-01-01T00:00:00.000Z']);
        });

        $response = $this->getJson('/api/cardano/network-status');

        $response->assertStatus(200)
            ->assertJson(['status' => 'degraded']);
    }

    public function test_returns_unreachable_status(): void
    {
        $this->mock(CardanoNetworkService::class, function ($mock) {
            $mock->shouldReceive('getNetworkStatus')
                ->once()
                ->andReturn(['status' => 'unreachable', 'lastBlockTime' => null]);
        });

        $response = $this->getJson('/api/cardano/network-status');

        $response->assertStatus(200)
            ->assertJson(['status' => 'unreachable', 'lastBlockTime' => null]);
    }

    public function test_endpoint_is_public(): void
    {
        $this->mock(CardanoNetworkService::class, function ($mock) {
            $mock->shouldReceive('getNetworkStatus')
                ->once()
                ->andReturn(['status' => 'healthy', 'lastBlockTime' => null]);
        });

        // No auth — unauthenticated request
        $response = $this->getJson('/api/cardano/network-status');

        $response->assertStatus(200);
    }
}
