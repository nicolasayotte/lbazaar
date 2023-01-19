<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserCertification>
 */
class UserCertificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $sampleCertificates = [
            'Certificate of Completion',
            'Certificate of Proficiency',
            'Certificate of Competency'
        ];

        return [
            'title'      => fake()->randomElement($sampleCertificates),
            'awarded_at' => fake()->dateTimeThisDecade(),
            'awarded_by' => fake()->company()
        ];
    }
}
