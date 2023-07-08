<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class NftFormRequest extends FormRequest
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
        $uniqueRule = Rule::unique('nfts', 'name');

        if (@$this->id) $uniqueRule->ignore($this->id);

        return [
            'name' => [
                'required',
                'alpha_dash',
                $uniqueRule
            ],
            'points' => [
                'required',
                'integer',
                'min:0'
            ],
            'for_sale' => [
                'integer',
                'min:0',
                'max:1'
            ],
            'image_url' => [
                'required',
                'alpha_dash'
            ]
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
            'points' => $this->points,
            'for_sale' => $this->for_sale,
            'image_url' => $this->image_url
        ];

        if (@$this->id) {
            $errorValues['id'] = @$this->id;
        }

        $this->validator->errors()->add('values', $errorValues);

        throw (new ValidationException($validator))
                    ->errorBag($this->errorBag)
                    ->redirectTo($this->getRedirectUrl());
    }
}
