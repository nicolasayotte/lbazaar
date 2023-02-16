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
            UserWallet::create([
                'user_id' => $user->id,
                'points' => fake()->numberBetween(1, 100),
            ]);
        }
    }
}
