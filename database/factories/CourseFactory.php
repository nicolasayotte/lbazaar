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
            'title'           => $this->faker->sentence(),
            'description'     => $this->faker->paragraph(),
            'language'        => $this->faker->languageCode(),
            'image_thumbnail' => 'https://picsum.photos/id/'.(fake()->numberBetween(100, 140)).'/1000/650',
            'nft_id'          => null,
            'course_type_id'  => null,
            'video_path'      => 'https://www.youtube.com/embed/'.\Database\Factories\CourseApplicationFactory::YOUTUBE_CODES[fake()->numberBetween(0, count(\Database\Factories\CourseApplicationFactory::YOUTUBE_CODES)-1)],
            'zoom_link'       => fake()->url(),
            'is_live'         => fake()->boolean(),
            'price'           => fake()->randomFloat(2, 0, 100),
            'points_earned'   => fake()->randomFloat(2, 0, 100),
            'professor_id'    => null,
            'course_application_id' => null,
            'max_participant' => fake()->numberBetween(1, 100),
            'is_cancellable'  => fake()->boolean(),
            'days_before_cancellation' => fake()->numberBetween(0, 30),
        ];
    }
}
