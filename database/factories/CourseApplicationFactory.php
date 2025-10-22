<?php

namespace Database\Factories;

use App\Models\CourseCategory;
use App\Models\CourseType;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseApplication>
 */
class CourseApplicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    CONST YOUTUBE_CODES = ['R3wiX05SJps', '7lmCu8wz8ro', 'o8NPllzkFhE','7ond5eF7L-I','eI0r_aL4rhg','RRgAdi3gX-s','lAJWHHUz8_8','zIwLWfaAg-8','OlLFK8oSNEM'];
    public function definition()
    {
        $user = User::whereRoleIs(Role::TEACHER)->inRandomOrder()->first();
        if (!$user) {
            $user = User::factory()->create();
            // Optionally assign TEACHER role if needed
        }

        return [
            'title'              => fake()->sentence(),
            'description'        => fake()->paragraphs(4, true),
            'price'              => fake()->numberBetween(10, 100),
            'points_earned'      => 0,
            'approved_at'        => null,
            'denied_at'          => null,
            'created_at'         => Carbon::now(),
            'course_type_id'     => $this->getCourseType(CourseType::GENERAL),
            'professor_id'       => $user->id,
            'max_participant'    => fake()->randomNumber(3),
            'is_live'            => fake()->randomElement([true, false]),
            'lecture_frequency'  => 'daily',
            'length'             => '01:00:00'
        ];
    }

    public function free()
    {
        return $this->state(fn (array $attributes) => [
            'price'          => 0,
            'course_type_id' => $this->getCourseType(CourseType::FREE)
        ]);
    }

    public function earn()
    {
        return $this->state(fn (array $attributes) => [
            'price'          => 0,
            'points_earned'  => fake()->numberBetween(1, 20),
            'course_type_id' => $this->getCourseType(CourseType::EARN)
        ]);
    }

    public function special()
    {
        return $this->state(fn (array $attributes) => [
            'course_type_id' => $this->getCourseType(CourseType::SPECIAL)
        ]);
    }

    public function approved()
    {
        return $this->state(fn (array $attributes) => [
            'approved_at' => fake()->dateTime(),
            'denied_at'   => null
        ]);
    }

    public function denied()
    {
        return $this->state(fn (array $attributes) => [
            'approved_at' => null,
            'denied_at'   => fake()->dateTime()
        ]);
    }

    /**
     * Get the course type by name
     * @param string $type The name of the course type
     * @return int|null
     */
    private function getCourseType($type)
    {
        $type = CourseType::where('name', $type)->first();

        return @$type ? @$type->id : null;
    }
}
