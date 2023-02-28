<?php

namespace App\Http\Requests\API;

use App\Models\CourseType;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CourseApplicationRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'email' => 'required|exists:users,email',
            'category' => 'required',
            'type' => ['required', Rule::in([strtolower(CourseType::FREE), strtolower(CourseType::GENERAL), strtolower(CourseType::SPECIAL), strtolower(CourseType::EARN)])],
            'price' => 'required_if:type,'. strtolower(CourseType::GENERAL).','. strtolower(CourseType::SPECIAL).'|min:0|numeric',
            'points_earned' => 'required_if:course_type_id,' . strtolower(CourseType::EARN),
            'title' => 'required',
            'description' => 'required',
            'max_participants' => 'required|min:0|numeric',
            'video_link' => 'required|url',
            'status' => ['required', Rule::in(['approved', 'denied'])],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
        'errors' => $validator->errors(),
        ], 422));
    }
}
