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
        $roles = $this->model->get();

        return $roles->map(function($role) {
            return [
                'name' => ucfirst($role->name),
                'value' => $role->name
            ];
        });
    }
}
