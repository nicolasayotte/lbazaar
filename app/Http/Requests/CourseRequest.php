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
    public function rules()
    {
        $rules = [
            'title'                    => 'required',
            'description'              => 'required',
            'category'                 => 'required',
            'course_type_id'           => 'required',
            'max_participant'          => 'integer|required|min:0',
            'format'                   => 'required',
            'zoom_link'                => 'required_if:format,' . Course::LIVE,
            'is_cancellable'           => 'boolean',
            'days_before_cancellation' => 'required_if:is_cancellable,true',
            'image_thumbnail'          => 'required',
            'video_path'               => 'required_if:format,' . Course::ON_DEMAND,
            'certificate_enabled'      => 'boolean',
            'certificate_name'         => 'required_if:certificate_enabled,1,true|nullable|string|max:255',
            'certificate_description'  => 'required_if:certificate_enabled,1,true|nullable|string|max:1000',
            'certificate_image_url'    => 'nullable|url|max:2048',
            'token_reward_enabled'     => 'boolean',
            'token_reward_amount'      => 'required_if:token_reward_enabled,1,true|nullable|integer|min:1|max:1000000',
        ];

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
            'category'                 => getTranslation('texts.category'),
            'course_type_id'           => getTranslation('texts.type'),
            'image_thumbnail'          => getTranslation('texts.class_image'),
            'zoom_link'                => getTranslation('texts.class_url'),
            'video_path'               => getTranslation('texts.video'),
            'is_cancellable'           => getTranslation('texts.cancellable'),
            'days_before_cancellation' => getTranslation('texts.days'),
            'certificate_name'         => getTranslation('texts.certificate_name'),
            'certificate_description'  => getTranslation('texts.certificate_description'),
            'token_reward_amount'      => getTranslation('texts.token_reward_amount'),
        ];

        return array_map('strtolower', $attributes);
    }
}
