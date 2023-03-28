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
        $courseHistoryRepository = new CourseHistoryRepository;
        return  $courseHistoryRepository->findByUserAndCourseScheduleID(Auth::id(), $this->schedule_id);
    }

    /**
     * Get data to be validated from the request.
     *
     * @return array
     */
    public function validationData()
    {
        $inputs = parent::all();

        $inputs['content'] = strip_tags($inputs['comments']);

        return $inputs;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'rating'   => 'required|numeric|min:0|max:100',
            'content' => 'required'
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
            'rating'  => strtolower(getTranslation('texts.rating')),
            'content' => strtolower(getTranslation('texts.content'))
        ];
    }
}
