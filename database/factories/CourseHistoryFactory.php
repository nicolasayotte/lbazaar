<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseHistory>
 */
class CourseHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'is_cancelled' => false,
            'certificate_status' => null,
            'certificate_tx_hash' => null,
            'certificate_minted_at' => null,
        ];
    }

    /**
     * Indicate the course has been completed
     */
    public function completed()
    {
        return $this->state(function (array $attributes) {
            return [
                'completed_at' => now()->subDays(rand(1, 30)),
            ];
        });
    }

    /**
     * Indicate the course is completed and certificate is eligible for minting.
     *
     * Certificate Status Lifecycle:
     * 1. null → Course not completed
     * 2. 'eligible' → Course completed, ready to mint
     * 3. 'minting' → Minting in progress
     * 4. 'minted' → Successfully minted
     * 5. 'failed' → Minting failed (can retry)
     */
    public function completedEligible()
    {
        return $this->state(function (array $attributes) {
            return [
                'completed_at' => now()->subDays(rand(1, 30)),
                'certificate_status' => 'eligible',
            ];
        });
    }

    /**
     * Indicate the certificate is currently being minted
     */
    public function minting()
    {
        return $this->state(function (array $attributes) {
            return [
                'completed_at' => now()->subDays(rand(1, 30)),
                'certificate_status' => 'minting',
            ];
        });
    }

    /**
     * Indicate the certificate has been minted
     */
    public function minted()
    {
        return $this->state(function (array $attributes) {
            return [
                'completed_at' => now()->subDays(rand(10, 60)),
                'certificate_status' => 'minted',
                'certificate_tx_hash' => substr(fake()->sha256(), 0, 64),
                'certificate_minted_at' => now()->subDays(rand(1, 10)),
            ];
        });
    }

    /**
     * Indicate the certificate minting failed
     */
    public function failed()
    {
        return $this->state(function (array $attributes) {
            return [
                'completed_at' => now()->subDays(rand(1, 30)),
                'certificate_status' => 'failed',
            ];
        });
    }
}
