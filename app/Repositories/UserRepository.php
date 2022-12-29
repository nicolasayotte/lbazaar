<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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
        if (@$filters['sort']) {
            $sortFilterArr = explode(':', $filters['sort']);

            $sortBy = $sortFilterArr[0];
            $sortOrder = $sortFilterArr[1];
        } else {
            $sortBy = 'created_at';
            $sortOrder = 'desc';
        }

        return $this->model
                ->where(function($q) use($filters){
                    return $q->where(DB::raw("CONCAT('first_name', ' ', 'last_name')"), 'LIKE', '%'. @$filters['keyword'] . '%')
                             ->orWhere('email', 'LIKE', '%', @$filters['keyword'] . '%');
                })
                ->when(@$filters['role'] && !empty(@$filters['role']), function($q) use($filters) {
                    return $q->whereRoleIs($filters['role']);
                })
                ->when(@$filters['status'] && !empty(@$filters['status']), function($q) use($filters) {
                    return $q->where('is_enabled', @$filters['status']);
                })
                ->orderBy($sortBy, $sortOrder)
                ->paginate(self::PER_PAGE)
                ->through(function($user) {
                    return UserData::fromModel($user);
                });
    }

    public function getFeaturedTeachers($take = self::PER_PAGE)
    {
        return $this->model->take($take)->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

    public function getAllTeachers()
    {
        return $this->model->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

}
