<?php

namespace Database\Factories;

use App\Models\CourseCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseCategoryFactory extends Factory
{
    protected $model = CourseCategory::class;

    public function definition()
    {
        return [
            'name' => $this->faker->words(2, true),
        ];
    }
}
