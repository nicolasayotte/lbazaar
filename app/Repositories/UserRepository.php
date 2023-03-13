<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;
use App\Data\UserData;
use Illuminate\Support\Collection;

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

    public function getTeacherSchedules(int $id)
    {
        $user = $this->getOne($id);
        $courses = $user->createdCourses()->get();
        $schedules = new Collection();
        foreach ($courses as $course) {
           $schedules = $schedules->merge($course->schedules()->get());
        }

        return $schedules;
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
}
