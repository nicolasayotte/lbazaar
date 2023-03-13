<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\CourseType;
use App\Models\Role;
use App\Repositories\CourseTypeRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'title'             => 'required',
            'type'              => 'required',
            'format'            => 'required',
            'category'          => 'required',
            'lecture_frequency' => 'required',
            'length'            => 'required',
            'price'             => 'required_if:type,' . CourseType::GENERAL . '|integer|min:1',
            'points_earned'     => 'required_if:type, ' . CourseType::EARN . '|min:1',
            'seats'             => 'required|integer|min:1',
            'description'       => 'required'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'title'             => strtolower(getTranslation('texts.title')),
            'type'              => strtolower(getTranslation('texts.type')),
            'format'            => strtolower(getTranslation('texts.format')),
            'category'          => strtolower(getTranslation('texts.category')),
            'lecture_frequency' => strtolower(getTranslation('texts.frequency')),
            'length'            => strtolower(getTranslation('texts.length')),
            'price'             => strtolower(getTranslation('texts.price')),
            'points_earned'     => strtolower(getTranslation('texts.points_earned')),
            'seats'             => strtolower(getTranslation('texts.seats')),
            'description'       => strtolower(getTranslation('texts.description'))
        ];
    }
}
