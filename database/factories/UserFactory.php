<?php

namespace Database\Factories;

use App\Models\Classifications;
use App\Models\User;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $country = \App\Models\Country::inRandomOrder()->first() ?? \App\Models\Country::factory()->create();

        return [
            'first_name'        => fake()->firstName(),
            'last_name'         => fake()->lastName(),
            'discord_id'        => fake()->lexify('?????#') . fake()->numerify('####'),
            'image'             => 'https://picsum.photos/id/'.(fake()->numberBetween(100, 140)).'/1000/650',
            'about'             => fake()->paragraphs(4, 2),
            'university'        => 'University of ' . fake()->city(),
            'specialty'         => fake()->sentence(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => fake()->dateTime(),
            'country_id'        => $country->id,
            'password'          => Hash::make('test1234'),
            'is_temp_password'  => false,
            'is_enabled'        => true,
            'remember_token'    => null,
            'created_at'        => fake()->dateTime(),
            'classification_id' => null,
            'commission_rate'   => fake()->numberBetween(10, 90),
            'commission_earn_rate' => fake()->numberBetween(10, 90)
        ];
    }

    /**
     * Configure the factory to set custodial_address after creating the model.
     *
     * @return $this
     */
    public function configure()
    {
        return $this->afterCreating(function (User $user) {
            // call Node script to get custodial address JSON
            $script = base_path('web3/common/get-custodial-address.mjs');
            $process = new Process(['node', $script, (string) $user->id]);
            $process->run();
            if (! $process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }
            $output = $process->getOutput();
            $data = json_decode($output, true);
            $address = $data['address'] ?? null;
            $user->updateQuietly([ 'custodial_address' => $address ]);
        });
    }

    public function unverified()
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function temporaryPassword()
    {
        return $this->state(fn (array $attributes) => [
            'is_temp_password' => true
        ]);
    }

    public function disabled()
    {
        return $this->state(fn (array $attributes) => [
            'is_enabled' => false
        ]);
    }

    public function classified()
    {
        $classification = Classifications::first();

        return $this->state(fn (array $attributes) => [
            'classification_id' => $classification->id
        ]);
    }
}
