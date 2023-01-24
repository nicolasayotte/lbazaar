<?php

namespace Database\Factories;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseContent>
 */
class CourseContentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'title'           => fake()->sentence(),
            'description'     => fake()->paragraph(4),
            'zoom_link'       => fake()->url(),
            'image_thumbnail' => 'https://picsum.photos/id/'.(fake()->numberBetween(100, 140)).'/1000/650',
            'is_live'         => true,
            'sort'            => 1,
            'max_participant' => 1000,
            'schedule_datetime' => Carbon::now()->addDays(7)
        ];
    }
}
