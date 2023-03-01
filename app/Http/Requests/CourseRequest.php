<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseRequest extends FormRequest
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
    public function rules(Request $request)
    {
        $rules = [
            'title' => 'required',
            'description' => 'required',
            'course_category_id' => 'required',
            'course_type_id' => 'required',
            'max_participant' => 'integer|required|min:1',
            'format' => 'required',
            'zoom_link' => 'required_if:format,' . Course::LIVE,
            'is_cancellable' => 'boolean',
            'days_before_cancellation' => 'required_if:is_cancellable,true'
        ];

        if ($request->hasFile('image_thumbnail') || $request->routeIs('course.create')) {
            $rules['image_thumbnail'] = 'required|file|image|dimensions:min_width=800,min_height:600';
        }

        if ($request->hasFile('video_path') || $request->routeIs('course.create')) {
            $rules['video_path'] = 'required_if:format,' . Course::ON_DEMAND;
        }

        return $rules;
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        $attributes = [
            'course_category_id' => getTranslation('texts.category'),
            'course_type_id' => getTranslation('texts.type'),
            'image_thumbnail' => getTranslation('texts.class_image'),
            'zoom_link' => getTranslation('texts.zoom_link'),
            'video_path' => getTranslation('texts.video'),
            'is_cancellable' => getTranslation('texts.cancellable'),
            'days_before_cancellation' => getTranslation('texts.days')
        ];

        return array_map('strtolower', $attributes);
    }
}
