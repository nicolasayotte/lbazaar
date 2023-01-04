<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;
use App\Data\UserData;

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
        $user = $this->findOrFail($id);

        return UserData::fromModel($user);
    }

    public function getFeaturedTeachers($take = self::PER_PAGE)
    {
        return $this->model->take($take)->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
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
