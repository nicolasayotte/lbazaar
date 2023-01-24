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
        return [
            'name' => [
                'required',
                Rule::unique('classifications', 'name')->where(function ($query) {
                    return $query->where('deleted_at', NULL);
                })
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
        if (@$this->id) {
            $this->validator->errors()->add('id', $this->id);
        }

        $this->validator->errors()->add($this->action, [
            'name' => $this->name,
            'commision_rate' => $this->commision_rate
        ]);

        throw (new ValidationException($validator))
                    ->errorBag($this->errorBag)
                    ->redirectTo($this->getRedirectUrl());
    }
}
