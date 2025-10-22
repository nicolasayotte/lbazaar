<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Rules\ValidSchedule;
use Carbon\Carbon;
use DateTime;
use DateTimeZone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return auth()->user() && auth()->user()->hasRole(Role::TEACHER);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        $now = Carbon::parse(new DateTime('now', new DateTimeZone(env('APP_TIMEZONE'))))->format('Y-m-d h:i A');

        return [
            'start_datetime' => [
                'required',
                'after_or_equal:' . $now,
                new ValidSchedule($this->id)]
        ];
    }
}
