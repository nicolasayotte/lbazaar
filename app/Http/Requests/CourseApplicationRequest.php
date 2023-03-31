<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\CourseType;
use App\Models\Role;
use App\Repositories\CourseTypeRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseApplicationRequest extends FormRequest
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
        $isPaid = $this->type == strtolower(CourseType::GENERAL) || $this->type == strtolower(CourseType::SPECIAL);
        $isEarn = $this->type == strtolower(CourseType::EARN);
        $isLive = $this->get('format') == Course::LIVE;
        $priceRules = [
            Rule::requiredIf($isPaid),
            'integer',
            'min:' . ($isPaid ? '1' : '0')
        ];

        $pointsRules = [
            Rule::requiredIf($isEarn),
            'integer',
            'min:' . ($isEarn ? '1' : '0')
        ];

        $seatsRules = [
            Rule::requiredIf($isLive),
            'integer',
            'min:' . ($isLive ? '1' : '0')
        ];

        return [
            'title'             => 'required',
            'type'              => 'required',
            'format'            => ['required', Rule::in([Course::LIVE, Course::ON_DEMAND])],
            'category'          => 'required',
            'lecture_frequency' => 'required',
            'length'            => 'required',
            'price'             => $priceRules,
            'points_earned'     => $pointsRules,
            'seats'             => $seatsRules,
            'description'       => 'required'
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
            'title'             => strtolower(getTranslation('texts.title')),
            'type'              => strtolower(getTranslation('texts.type')),
            'format'            => strtolower(getTranslation('texts.format')),
            'category'          => strtolower(getTranslation('texts.category')),
            'lecture_frequency' => strtolower(getTranslation('texts.frequency')),
            'length'            => strtolower(getTranslation('texts.length')),
            'price'             => strtolower(getTranslation('texts.price')),
            'points_earned'     => strtolower(getTranslation('texts.points_earned')),
            'seats'             => strtolower(getTranslation('texts.seats')),
            'description'       => strtolower(getTranslation('texts.description'))
        ];
    }
}
