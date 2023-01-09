<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return auth()->user() && auth()->user()->hasRole(Role::ADMIN);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'first_name'        => 'required|alpha_spaces',
            'last_name'         => 'required|alpha_spaces',
            'email'             => 'required|email|unique:users,email',
            'role'              => 'required',
            'classification_id' => 'required_if:role,==,'.Role::TEACHER,
            'country_id'        => 'required'
        ];
    }

    /**
     * Get the error messages for the defined validation rules
     *
     * @return array
     */
    public function messages()
    {
        return [
            'country_id.required'           => trans('validation.required', ['attribute' => 'country']),
            'classification_id.required_if' => trans('validation.required_if', [
                'attribute' => 'classification',
                'other'     => 'role',
                'value'     => Role::TEACHER
            ])
        ];
    }
}
