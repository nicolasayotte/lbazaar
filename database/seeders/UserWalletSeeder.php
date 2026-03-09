<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Database\Seeder;

class UserWalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $users = User::all();

        foreach ($users as $user) {
            $hash = substr(hash('sha256', 'seed-wallet-' . $user->id), 0, 56);

            // Only seed stake_key_hash; leave address null so it must be set
            // via wallet verification (CIP-30). Fake bech32 addresses cause
            // Helios Address.fromBech32() to reject them at runtime.
            UserWallet::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'stake_key_hash' => $hash,
                ]
            );
        }
    }
}
