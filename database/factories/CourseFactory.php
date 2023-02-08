<?php

namespace Database\Factories;

use App\Models\CourseCategory;
use App\Models\CourseType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'image_thumbnail' => 'https://picsum.photos/id/'.(fake()->numberBetween(100, 140)).'/1000/650'
        ];
    }
}
