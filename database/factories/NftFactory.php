<?php

namespace Database\Factories;

use App\Models\Nft;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Nft>
 */
class NftFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Nft::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'mph' => $this->faker->regexify('[a-f0-9]{56}'), // Mock minting policy hash
            'name' => $this->faker->word(),
            'description' => $this->faker->sentence(),
            'points' => $this->faker->numberBetween(0, 100),
            'for_sale' => $this->faker->boolean(),
            'image_url' => 'Qm' . $this->faker->regexify('[a-zA-Z0-9]{44}'), // Mock IPFS hash
        ];
    }

    /**
     * Indicate that the NFT is a certificate template.
     */
    public function certificate(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Certificate',
            'description' => 'Certificate NFT template',
            'points' => 0,
            'for_sale' => false,
        ]);
    }

    /**
     * Indicate that the NFT is for sale.
     */
    public function forSale(): static
    {
        return $this->state(fn (array $attributes) => [
            'for_sale' => true,
        ]);
    }
}
