<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class Web3NftVerifyHwRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'walletSig' => 'required|alpha_num|max:8192',
            'cborTx' => 'required|alpha_num|max:16384',
            'wallet_addr' => 'required|alpha_dash|max:256',
            'nft_name' => 'required|alpha_dash|max:15',
            'serial_num' => 'required|int|min:0'
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
        'errors' => $validator->errors(),
        ], 422));
    }
}
