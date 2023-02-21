<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Rules\ValidSchedule;
use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'start_datetime' => ['required', new ValidSchedule($this->id)]
        ];
    }
}
