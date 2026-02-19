<?php

namespace App\Http\Requests;

use App\Models\CourseSchedule;
use App\Repositories\CourseHistoryRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BuildPurchaseTxRequest extends FormRequest
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

        $scheduleId = $this->route('schedule_id');

        if (!$scheduleId) {
            return false;
        }

        $schedule = CourseSchedule::with('course')->find($scheduleId);

        if (!$schedule) {
            return false;
        }

        // User must NOT be the course owner
        if ($schedule->course->professor_id === $this->user()->id) {
            return false;
        }

        // User must NOT already be booked for this schedule
        $courseHistoryRepo = new CourseHistoryRepository();
        $existingBooking = $courseHistoryRepo->findNonFailedByUserAndCourseScheduleID(
            $this->user()->id,
            $scheduleId
        );

        if (is_countable($existingBooking) ? count($existingBooking) > 0 : !empty($existingBooking)) {
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
        return [];
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
