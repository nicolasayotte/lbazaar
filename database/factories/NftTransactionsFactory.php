<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\NftTransactions>
 */
class NftTransactionsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'nft_id' => fake()->numberBetween(1, 1000),
            'nft_name' => 'Certificate_' . fake()->word(),
            'serial_num' => fake()->numberBetween(1, 10000),
            'course_id' => \App\Models\Course::factory(),
            'schedule_id' => \App\Models\CourseSchedule::factory(),
            'used' => false,
            'tx_id' => substr(fake()->sha256(), 0, 64),
            'mph' => substr(fake()->sha256(), 0, 56),
            'metadata' => json_encode([
                'name' => 'Certificate',
                'image' => 'https://example.com/certificate.png',
                'description' => 'Course completion certificate'
            ])
        ];
    }
}
