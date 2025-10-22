<?php

namespace App\Repositories;

use App\Models\Role;

class RoleRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Role());
    }

    public function getDropdownData()
    {
        return $this->model->all()->map(function($role) {
            return [
                'name' => ucfirst($role->name),
                'value' => $role->name
            ];
        });
    }
}
