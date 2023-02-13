<?php

namespace Database\Factories;

use App\Models\Classifications;
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
        $countryIds = DB::table('countries')->select('id')->pluck('id');

        return [
            'first_name'        => fake()->firstName(),
            'last_name'         => fake()->lastName(),
            'image'             => 'https://picsum.photos/id/'.(fake()->numberBetween(100, 140)).'/1000/650',
            'about'             => fake()->paragraphs(4, 2),
            'specialty'         => fake()->sentence(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => fake()->dateTime(),
            'country_id'        => fake()->randomElement($countryIds),
            'password'          => Hash::make('test1234'),
            'is_temp_password'  => false,
            'is_enabled'        => true,
            'remember_token'    => null,
            'created_at'        => fake()->dateTime(),
            'classification_id' => null
        ];
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
