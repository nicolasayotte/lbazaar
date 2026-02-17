<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StripePayment>
 */
class StripePaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
            'course_history_id' => null,
            'stripe_payment_intent_id' => 'pi_test_' . $this->faker->uuid(),
            'stripe_customer_id' => 'cus_test_' . $this->faker->uuid(),
            'amount' => $this->faker->numberBetween(1000, 50000), // Amount in cents
            'currency' => $this->faker->randomElement(['usd', 'jpy']),
            'status' => $this->faker->randomElement(['succeeded', 'pending', 'failed']),
            'receipt_url' => $this->faker->url(),
            'metadata' => [
                'course_name' => $this->faker->sentence(3),
                'student_email' => $this->faker->safeEmail(),
            ],
        ];
    }

    /**
     * Indicate that the payment succeeded.
     */
    public function succeeded()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'succeeded',
            ];
        });
    }

    /**
     * Indicate that the payment is pending.
     */
    public function pending()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'pending',
            ];
        });
    }

    /**
     * Indicate that the payment failed.
     */
    public function failed()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'failed',
            ];
        });
    }
}
