<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class CourseApplicationRequest extends FormRequest
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
            'course_category_id'    => 'required',
            'course_type_id'        => 'required',
            'price'                 => 'required|min:0|numeric',
            'title'                 => 'required',
            'description'           => 'required',
            'seats'                 => 'required|min:0|numeric',
            'language'              => 'required',
            'lecture_type'          => 'required'
        ];
    }
}
