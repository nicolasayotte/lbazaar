<?php

namespace App\Http\Requests;

use App\Models\CourseHistory;
use App\Repositories\CourseHistoryRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class FeedbackRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $course_id = $this->route('id');

        $courseHistoryRepository = new CourseHistoryRepository;
        return  $courseHistoryRepository->isUserBookedCourse(Auth::id(), $course_id);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'rating'        => 'required|numeric|min:0|max:100',
            'comments'      => 'required'
        ];
    }
}
