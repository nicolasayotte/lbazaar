<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ClassificationFormRequest extends FormRequest
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
        $uniqueRule = Rule::unique('classifications', 'name')->where(function ($query) {
            return $query->where('deleted_at', NULL);
        });

        if (@$this->id) {
            $uniqueRule->ignore($this->id);
        }

        return [
            'name' => [
                'required',
                $uniqueRule
            ],
            'commision_rate' => 'required|numeric|min:1|max:100'
        ];
    }

    /**
     * Set custom attributes for messages
     *
     * @return array
    */
    public function attributes()
    {
        return [
            'commision_rate' => 'commission rate'
        ];
    }

    /**
     * @Override
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    protected function failedValidation(Validator $validator)
    {
        $errorValues = [
            'name' => $this->name,
            'commision_rate' => $this->commision_rate
        ];

        if (@$this->id) {
            $errorValues['id'] = $this->id;
        }

        $this->validator->errors()->add('values', $errorValues);

        throw (new ValidationException($validator))
                    ->errorBag($this->errorBag)
                    ->redirectTo($this->getRedirectUrl());
    }
}
