<?php

namespace App\Http\Requests\API;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BatchMintCertificatesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        // Check if user has teacher role
        if (!$this->user() || !$this->user()->hasRole('teacher')) {
            return false;
        }

        // Check if teacher owns the course
        $courseId = $this->input('course_id');
        if ($courseId) {
            $course = Course::where('id', $courseId)
                ->where('professor_id', $this->user()->id)
                ->first();

            return $course !== null;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'course_id' => 'required|integer|exists:courses,id',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|integer|exists:users,id',
            'schedule_id' => 'nullable|integer|exists:course_schedules,id'
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'student_ids.required' => 'At least one student must be selected for certificate minting.',
            'student_ids.array' => 'The student IDs must be provided as an array.',
            'student_ids.min' => 'At least one student must be selected for certificate minting.',
            'student_ids.*.required' => 'Each student ID is required.',
            'student_ids.*.integer' => 'Each student ID must be a valid integer.',
            'student_ids.*.exists' => 'One or more selected students do not exist in the system.'
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422));
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'You do not have permission to mint certificates for this course.'
        ], 403));
    }
}
