<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserWorkHistory>
 */
class UserWorkHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $randomEndDate = fake()->dateTimeThisDecade();

        return [
            'company'     => fake()->company(),
            'position'    => fake()->jobTitle(),
            'start_date'  => fake()->dateTimeThisDecade($randomEndDate),
            'end_date'    => $randomEndDate,
            'description' => fake()->paragraph()
        ];
    }
}
