<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;
use App\Data\UserData;
use App\Models\TeacherApplication;
use App\Services\API\EmailService;
use Illuminate\Support\Collection;
use DragonCode\Support\Facades\Helpers\Str;
use Illuminate\Support\Facades\Hash;

class UserRepository extends BaseRepository
{
    const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new User());
    }

    public function get($filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model
                ->where('id', '!=', auth()->user()->id)
                ->where( function($q) use($filters){
                    return $q->whereRaw("CONCAT(`first_name`, ' ', `last_name`) LIKE ?", ['%'. @$filters['keyword'] .'%'])
                             ->orWhere('email', 'LIKE', '%'. @$filters['keyword'] .'%');
                })
                ->when(@$filters['role'] && !empty(@$filters['role']), function($q) use($filters) {
                    return $q->whereRoleIs($filters['role']);
                })
                ->when(@$filters['status'] && !empty(@$filters['status']), function($q) use($filters) {
                    return $q->where('is_enabled', @$filters['status'] == User::ACTIVE ? 1 : 0);
                })
                ->orderBy($sortBy, $sortOrder)
                ->paginate(self::PER_PAGE)
                ->through(function($user) {
                    return UserData::fromModel($user);
                });
    }

    public function findOne(int $id)
    {
        $user = $this->model->with('courses', 'createdCourses')->findOrFail($id);

        return UserData::fromModel($user);
    }

    public function getOne(int $id)
    {
        return $this->model->with('courses', 'createdCourses', 'userEducation', 'userCertification', 'userWorkHistory', 'roles', 'country', 'userWallet')->findOrFail($id);
    }

    public function getStudents(int $id)
    {
        $user = $this->getOne($id);
        $createdCourses = $user->createdCourses()->get();
        $students = new Collection();
        foreach ($createdCourses as $createdCourse) {
            $courseStudents = $createdCourse->students();
            foreach ($courseStudents->get() as $courseStudent) {
                $students->add($courseStudent);
            }
        }

        return $students->unique('id');
    }

    public function getTeachers(int $id)
    {
        $user = $this->getOne($id);
        $courses = $user->courses()->get();
        $teachers = new Collection();
        foreach ($courses as $course) {
            $courseTeacher = $course->professor()->first();
            $teachers->add($courseTeacher);
        }

        return $teachers->unique('id');
    }

    public function getFeaturedTeachers($take = self::PER_PAGE)
    {
        return $this->model->take($take)->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

    public function getAdmin()
    {
        return $this->model->with('userWallet')->whereRoleIs([Role::ADMIN])->orderBy('id', 'desc')->first();
    }

    public function getAllTeachers()
    {
        return $this->model->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

    public function getStatusFilterData()
    {
        return [
            [
                'name'  => ucfirst(User::ACTIVE),
                'value' => User::ACTIVE
            ],
            [
                'name'  => ucfirst(User::DISABLED),
                'value' => User::DISABLED
            ]
        ];
    }

    public function createFromApi(TeacherApplication $applicationData)
    {
        $emailService = new EmailService();

        $data = json_decode($applicationData->data, true);

        $tempPassword = Str::random(User::RANDOM_PASSWORD_STRING_LENGTH);

        $data['password'] = Hash::make($tempPassword);
        $data['is_temp_password'] = true;
        $data['is_enabled'] = true;
        $data['country_id'] = fake()->numberBetween(1, 249);

        $user = $this->model->create($data);

        $user->userEducation()->createMany($data['education']);

        if (!empty(@$data['work'])) $user->userWorkHistory()->createMany(@$data['work']);
        if (!empty(@$data['certification'])) $user->userCertification()->createMany(@$data['certification']);

        $user->save();

        $emailService->sendEmailNotificationUserCreated($user, $tempPassword);
    }
}
