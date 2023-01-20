<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\CourseType;
use App\Models\Role;
use App\Repositories\CourseTypeRepository;
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
            'price'                 => 'required_if:course_type_id,'. CourseType::GENERAL_ID.','. CourseType::SPECIAL_ID.'|min:0|numeric',
            'price_earned'          => 'required_if:course_type_id,' . CourseType::EARN_ID,
            'title'                 => 'required',
            'description'           => 'required',
            'seats'                 => 'required|min:0|numeric',
            'language'              => 'required',
            'lecture_type'          => 'required'
        ];
    }

     /**
     * Get the error messages for the defined validation rules
     *
     * @return array
     */
    public function messages()
    {
        if (!empty($this->validationData()["course_type_id"])) {
            $courseTypeRepository = new CourseTypeRepository();
            $courseType =  $courseTypeRepository->getNameById($this->validationData()["course_type_id"]);
        }

        return [
            'course_category_id.required'       => trans('validation.required', ['attribute' => 'category']),
            'price_earned.required'             => trans('validation.required', ['attribute' => 'price earn']),
            'course_type_id.required'           => trans('validation.required', ['attribute' => 'type']),
            'lecture_type.required'             => trans('validation.required', ['attribute' => 'lecture type']),
            'price.required_if'                 => trans('validation.required_if', [
                'attribute'                     => 'price' ,
                'other'                         => 'course type',
                'value'                         => $courseType,
            ]),
            'price_earned.required_if' => trans('validation.required_if', [
                'attribute'                     => 'price earned' ,
                'other'                         => 'course type',
                'value'                         => $courseType,
            ]),
        ];
    }
}
