<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'first_name'            => 'required|alpha_spaces',
            'last_name'             => 'required|alpha_spaces',
            'email'                 => 'required|email|unique:users',
            'country_id'            => 'required',
            'password'              => 'required|confirmed|min:8',
            'password_confirmation' => 'required'
        ];
    }
}
