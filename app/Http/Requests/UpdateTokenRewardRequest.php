<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;

class UpdateTokenRewardRequest extends FormRequest
{
    public function authorize(): bool
    {
        $course = $this->route('course');
        return $course && $course->professor_id === Auth::id();
    }

    public function rules(): array
    {
        return [
            'token_reward_enabled' => 'required|boolean',
            'token_reward_amount'  => 'nullable|integer|min:1|max:1000000',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors'  => $validator->errors()
        ], 422));
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'You do not have permission to update this course.'
        ], 403));
    }
}
