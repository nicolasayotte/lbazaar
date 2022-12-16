<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchClassRequest extends FormRequest
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
            'search_text'       => 'nullable',
            'type_id'           => 'integer|nullable',
            'category_id'       => 'integer|nullable',
            'language'          => 'nullable',
            'professor_id'        => 'integer|nullable',
            'year'              => 'digits:4|nullable',
            'month'             => 'min:0|max:11|nullable'
        ];
    }
}
