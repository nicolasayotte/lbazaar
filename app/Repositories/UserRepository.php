<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;

class UserRepository extends BaseRepository
{
    const PERPAGE = 5;
    
    public function __construct()
    {
        parent::__construct(new User());
    }

    public function getFeaturedTeachers($take = self::PERPAGE)
    {
        return $this->model->take($take)->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

    public function getAllTeachers()
    {
        return $this->model->whereRoleIs([Role::TEACHER])->orderBy('id', 'desc')->get();
    }

}
