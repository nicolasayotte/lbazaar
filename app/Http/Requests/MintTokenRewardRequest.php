<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;

class MintTokenRewardRequest extends FormRequest
{
    public function authorize(): bool
    {
        $course = $this->route('course');
        return $course
            && $course->professor_id === Auth::id()
            && Auth::user()->hasRole('teacher');
    }

    public function rules(): array
    {
        return [
            'schedule_id' => 'nullable|integer|exists:course_schedules,id',
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
            'message' => 'You do not have permission to mint token rewards for this course.'
        ], 403));
    }
}
