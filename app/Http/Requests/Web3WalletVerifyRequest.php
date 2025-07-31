<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class Web3WalletVerifyRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'signature' => 'required|alpha_num|max:8192',
            'stake_key' => 'required|alpha_num|max:256',
            'message' => 'required|alpha_dash|max:8192',
            // Cardano addresses can contain letters, numbers, underscores, and other symbols
            'addr' => [
                'required',
                'regex:/^addr(_test)?1[0-9a-zA-Z]+$/',
                'max:256'
            ],
            'stake_addr' => 'required|alpha_dash|max:256',
        ];
     
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
        'errors' => $validator->errors(),
        ], 422));
    }
}
