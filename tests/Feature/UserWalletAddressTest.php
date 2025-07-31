<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserWalletAddressTest extends TestCase
{
    use RefreshDatabase;

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
            ->assertJsonFragment([
                'wallet_address' => 'addr_test1qpmocklinkedaddress',
                'wallet_type' => 'linked',
            ]);
    }

    /**
     * Test /user endpoint returns custodial wallet address if no linked wallet
     */
    public function test_user_endpoint_returns_custodial_wallet_address_if_none_linked()
    {
        $user = User::factory()->create();
        $user->userWallet()->create([
            'stake_key_hash' => null,
        ]);

        $this->actingAs($user);
        $response = $this->getJson('/api/user');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'wallet_address',
                'wallet_type',
            ])
            ->assertJsonFragment([
                'wallet_type' => 'custodial',
            ]);
        // Optionally: check address format
        $this->assertStringStartsWith('addr', $response->json('wallet_address'));
    }
}
