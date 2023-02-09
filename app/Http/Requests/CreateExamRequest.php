<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Repositories\TranslationRepository;
use Illuminate\Foundation\Http\FormRequest;

class CreateExamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return auth()->user() && auth()->user()->hasRole(Role::TEACHER);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'name'                => 'required',
            'items'               => 'required|array|min:1',
            'items.*.question'      => 'required',
            'items.*.points'        => 'required|numeric|min:1|max:100',
            'items.*.correct_index' => 'required',
            'items.*.choices'       => 'array|min:2|max:4',
            'items.*.choices.*.value' => 'required'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'correct_index' => 'correct choice',
            'items.*.question' => strtolower(TranslationRepository::getTranslation('texts.question')),
            'items.*.points'   => strtolower(TranslationRepository::getTranslation('texts.points')),
            'items.*.choices'   => strtolower(TranslationRepository::getTranslation('texts.question')),
            'items.*.choices.*.value' => strtolower(TranslationRepository::getTranslation('texts.choice'))
        ];
    }
}
