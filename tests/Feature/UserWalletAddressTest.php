<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class UserWalletAddressTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test /user endpoint returns linked wallet address if present
     */
    public function test_user_endpoint_returns_linked_wallet_address()
    {
        $user = User::factory()->create();
        $user->userWallet()->create([
            'stake_key_hash' => 'addr_test1qpmocklinkedaddress',
        ]);

        $this->actingAs($user);
        $response = $this->getJson('/api/user');
        $response->assertStatus(200)
            ->assertJsonPath('user_wallet.stake_key_hash', 'addr_test1qpmocklinkedaddress');
    }

    /**
     * Test /user endpoint returns custodial wallet address if no linked wallet
     */
    public function test_user_endpoint_always_returns_custodial_wallet_address()
    {
        $user = User::factory()->create();
        $user->userWallet()->create([
            'stake_key_hash' => null,
        ]);

        $this->actingAs($user);
        $response = $this->getJson('/api/user');
        $response->assertStatus(200)
            ->assertJsonPath('custodial_address', fn($value) => str_starts_with($value, 'addr'));
    }
}
