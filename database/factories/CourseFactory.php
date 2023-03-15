<?php

namespace Database\Factories;

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
            'image_thumbnail' => 'https://picsum.photos/id/'.(fake()->numberBetween(100, 140)).'/1000/650',
            'video_path'      => 'https://www.youtube.com/embed/'.CourseApplicationFactory::YOUTUBE_CODES[fake()->numberBetween(0, count(CourseApplicationFactory::YOUTUBE_CODES)-1)],
            'video_link'      => 'https://www.youtube.com/embed/'.CourseApplicationFactory::YOUTUBE_CODES[fake()->numberBetween(0, count(CourseApplicationFactory::YOUTUBE_CODES)-1)],
            'zoom_link'       => fake()->url(),
        ];
    }
}
