<?php

namespace Database\Factories;

use App\Models\UserWallet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserWallet>
 */
class UserWalletFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UserWallet::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $stakeKeyHash = $this->faker->optional(0.7)->regexify('[a-f0-9]{56}'); // 70% chance to have a stake key hash
        return [
            'user_id' => User::factory(),
            'points' => $this->faker->numberBetween(0, 1000),
            'credit' => $this->faker->randomFloat(2, 0, 100),
            'address' => 'addr_test1qpmockaddress',
            'stake_key_hash' => $stakeKeyHash,
        ];
    }

    /**
     * Indicate that the user wallet has no stake key hash (custodial).
     */
    public function custodial(): static
    {
        return $this->state(fn (array $attributes) => [
            'address' => null,
            'stake_key_hash' => null,
        ]);
    }

    /**
     * Indicate that the user wallet has a linked stake key hash.
     */
    public function linked(): static
    {
        return $this->state(fn (array $attributes) => [
            'address' => 'addr' . $this->faker->regexify('[a-f0-9]{56}'),
            'stake_key_hash' => $this->faker->regexify('[a-f0-9]{56}'),
        ]);
    }

    /**
     * Set a specific user for this wallet.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
