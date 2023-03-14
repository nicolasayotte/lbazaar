<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TeacherRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return !auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        $workRequiredIf = Rule::requiredIf(!empty($this->work));
        $certificationRequiredIf = Rule::requiredIf(!empty($this->certification));

        return [
            'first_name'                 => 'required',
            'last_name'                  => 'required',
            'email'                      => 'required|email|unique:users,email',
            'university'                 => 'required',
            'specialty'                  => 'required',
            'about'                      => 'required',
            'education'                  => 'required|array',
            'education.*.start_date'     => 'required',
            'education.*.end_date'       => 'nullable|after:education.*.start_date',
            'work'                       => 'nullable|array',
            'work.*.company'             => $workRequiredIf,
            'work.*.position'            => $workRequiredIf,
            'work.*.start_date'          => $workRequiredIf,
            'work.*.end_date'            => 'nullable|after:work.*.start_date',
            'certification'              => 'nullable|array',
            'certification.*.title'      => $certificationRequiredIf,
            'certification.*.awarded_at' => $certificationRequiredIf,
            'certification.*.awarded_by' => $certificationRequiredIf,
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
            'education'                  => strtolower(getTranslation('education.background')),
            'education.*.school'         => strtolower(getTranslation('education.school')),
            'education.*.degree'         => strtolower(getTranslation('education.degree')),
            'education.*.start_date'     => strtolower(getTranslation('class_schedule.start_date')),
            'education.*.end_date'       => strtolower(getTranslation('class_schedule.end_date')),
            'work.*.company'             => strtolower(getTranslation('work.company')),
            'work.*.position'            => strtolower(getTranslation('work.position')),
            'work.*.start_date'          => strtolower(getTranslation('class_schedule.start_date')),
            'work.*.end_date'            => strtolower(getTranslation('class_schedule.end_date')),
            'work.*.description'         => strtolower(getTranslation('work.description')),
            'certification'              => strtolower(getTranslation('texts.certification')),
            'certification.*.title'      => strtolower(getTranslation('texts.title')),
            'certification.*.awarded_at' => strtolower(getTranslation('certification.awarded_at')),
            'certification.*.awarded_by' => strtolower(getTranslation('certification.awarded_by')),
        ];
    }
}
