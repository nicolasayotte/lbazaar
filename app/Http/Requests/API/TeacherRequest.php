<?php

namespace App\Http\Requests\API;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class TeacherRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'first_name' => 'required|alpha_spaces',
            'last_name' => 'required|alpha_spaces',
            'email' => 'required|email|unique:users,email',
            'about'  => 'required',
            'specialty' => 'required',
            'country_id' => 'required|exists:countries,id',
            'commission_rate' => 'required',
            'commission_earn_rate'  => 'required',
            //eductaion
            'education.*.school'  => 'required',
            'education.*.degree' => 'required',
            'education.*.start_date' => 'required|date_format:Y-m-d',
            'education.*.end_date' => 'required|date_format:Y-m-d',
            //certifications
            'certifications.*.title' => 'required',
            'certifications.*.awarded_at' => 'required|date_format:Y-m-d',
            'certifications.*.awarded_by'  => 'required',
            //work history
            'work_history.*.company' => 'required',
            'work_history.*.position' => 'required',
            'work_history.*.description' => 'required',
            'work_history.*.start_date' => 'required|date_format:Y-m-d',
            'work_history.*.end_date' => 'required|date_format:Y-m-d',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
        'errors' => $validator->errors(),
        ], 422));
    }

}
