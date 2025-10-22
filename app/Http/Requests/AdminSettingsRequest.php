<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminSettingsRequest extends FormRequest
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
            'general_settings.inquiry-receiver-email'    => 'required|email',
            'general_settings.no-reply-email' => 'required|email',
            'general_settings.admin-commission' => 'required|integer|between: 1,100',
            'general_settings.vote-passing-percentage' => 'required|integer|between: 1,100',
            'general_settings.donate-commission' => 'required|integer|between: 1,100',
        ];
    }
}
