<?php

namespace Database\Seeders;

use App\Models\Classifications;
use Illuminate\Database\Seeder;

class ClassificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        for ($i = 0; $i < 3; $i++) {
            Classifications::create([
                'name'           => strtoupper(fake()->randomLetter()),
                'commision_rate' => fake()->numberBetween(0, 50)
            ]);
        }
    }
}
