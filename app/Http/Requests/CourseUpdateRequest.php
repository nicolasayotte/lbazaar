<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Repositories\CourseRepository;
use Illuminate\Foundation\Http\FormRequest;

class CourseUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $courseRepository = new CourseRepository();

        return $courseRepository->isMyCourseById($this->validationData()["id"]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'id'   => 'required',
            'title'   => 'required',
            'description'   => 'required',
            'language'   => 'required',
            'course_category_id'   => 'required',
            'imageThumbnail.*' => 'mimes:jpg,jpeg,png',
            'imageThumbnail' => 'max:1',
        ];
    }

    public function messages() {
        return [
          'imageThumbnail.max' => 'Only 1 image are allowed'
        ];
      }
}
