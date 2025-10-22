<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserEducation>
 */
class UserEducationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $sampleSpecializations = [
            'Computer Science',
            'Information Technology',
            'Computer Engineering'
        ];

        $sampleDegrees = [
            'BS',
            'MS',
            'PhD'
        ];

        $randomEndDate = fake()->dateTimeThisDecade();

        return [
            'school'      => 'University of ' . fake()->city(),
            'degree'     => fake()->randomElement($sampleDegrees) . ' in ' . fake()->randomElement($sampleSpecializations),
            'start_date' => fake()->dateTimeThisDecade($randomEndDate),
            'end_date'   => $randomEndDate
        ];
    }
}
