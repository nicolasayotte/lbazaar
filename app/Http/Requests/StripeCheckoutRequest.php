<?php

namespace App\Http\Requests;

use App\Repositories\CourseHistoryRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StripeCheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        if (!$this->user()) {
            return false;
        }

        $course = $this->route('course');

        if (!$course) {
            return false;
        }

        // User must NOT be the course professor (can't buy own course)
        if ($course->professor_id === $this->user()->id) {
            return false;
        }

        // User must NOT already be enrolled in this course
        $courseHistoryRepo = new CourseHistoryRepository();
        $existingEnrollment = $courseHistoryRepo->isUserBookedCourse(
            $this->user()->id,
            $course->id
        );

        if ($existingEnrollment) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'course_schedule_id' => 'nullable|integer|exists:course_schedules,id'
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422));
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'You are not authorized to purchase this course.'
        ], 403));
    }
}
