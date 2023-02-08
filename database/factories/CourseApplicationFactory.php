<?php

namespace Database\Factories;

use App\Models\CourseCategory;
use App\Models\CourseType;
use App\Models\Role;
use App\Models\User;
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
    public function definition()
    {
        $user = User::whereRoleIs(Role::TEACHER)->inRandomOrder()->first();

        $category = CourseCategory::inRandomOrder()->first();

        return [
            'title'              => fake()->sentence(),
            'description'        => fake()->paragraphs(4, true),
            'price'              => fake()->numberBetween(10, 100),
            'language'           => fake()->randomElement(['English', 'Japanese']),
            'points_earned'      => null,
            'approved_at'        => null,
            'denied_at'          => null,
            'created_at'         => fake()->dateTime(),
            'course_type'        => $this->getCourseType(CourseType::GENERAL),
            'professor_id'       => $user->id,
            'course_category'    => $category->name
        ];
    }

    public function free()
    {
        return $this->state(fn (array $attributes) => [
            'price'          => null,
            'course_type' => $this->getCourseType(CourseType::FREE)
        ]);
    }

    public function earn()
    {
        return $this->state(fn (array $attributes) => [
            'points_earned'  => fake()->numberBetween(1, 20),
            'course_type' => $this->getCourseType(CourseType::EARN)
        ]);
    }

    public function special()
    {
        return $this->state(fn (array $attributes) => [
            'course_type' => $this->getCourseType(CourseType::SPECIAL)
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

        return @$type ? @$type->name : null;
    }
}
