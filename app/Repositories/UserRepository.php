<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new User());
    }

    public function getFeaturedTeacher($take = 5)
    {
        return $this->model->take($take)->whereRoleIs(['teacher'])->orderBy('id', 'desc')->get();
    }

}
