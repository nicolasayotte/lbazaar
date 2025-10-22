<?php

namespace App\Rules;

use App\Repositories\CourseScheduleRepository;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\Rule;

class ValidSchedule implements Rule
{
    private $courseId;

    private $courseScheduleRepository;

    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct($courseId)
    {
        $this->courseId = $courseId;
        $this->courseScheduleRepository = new CourseScheduleRepository();
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        $scheduledDates = $this->courseScheduleRepository->getScheduledDates($this->courseId);

        return in_array(Carbon::parse($value)->format('Y-m-d'), $scheduledDates) ? false : true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return trans('validation.valid_schedule', ['attribute' => 'schedule']);
    }
}
