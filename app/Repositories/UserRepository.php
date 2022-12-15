<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;

class UserRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new User());
    }

    public function getFeaturedTeachers($take = 5)
    {
        return $this->model->take($take)->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

    public function getAllTeachers()
    {
        return $this->model->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

}
