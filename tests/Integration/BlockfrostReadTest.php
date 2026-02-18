<?php

namespace Tests\Integration;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tests\Traits\InteractsWithRealServices;

class BlockfrostReadTest extends TestCase
{
    use InteractsWithRealServices;

    protected function requiredServiceKeys(): array
    {
        return [
            'BLOCKFROST_API_KEY' => 'services.blockfrost.api_key',
        ];
    }

    private function blockfrostGet(string $path): \Illuminate\Http\Client\Response
    {
        $network = config('services.blockfrost.network', 'preprod');
        $baseUrl = "https://cardano-{$network}.blockfrost.io/api/v0";

        return Http::withHeaders([
            'project_id' => config('services.blockfrost.api_key'),
        ])->timeout(15)->get("{$baseUrl}{$path}");
    }

    /** @test */
    public function blockfrost_preprod_api_is_reachable()
    {
        $response = $this->blockfrostGet('/health');

        $this->assertTrue($response->successful());
        $this->assertTrue($response->json('is_healthy'));
    }

    /** @test */
    public function blockfrost_api_returns_valid_epoch_data()
    {
        $response = $this->blockfrostGet('/epochs/latest');

        $this->assertTrue($response->successful());

        $epoch = $response->json('epoch');
        $this->assertIsInt($epoch);
        $this->assertGreaterThan(0, $epoch);
    }
}
