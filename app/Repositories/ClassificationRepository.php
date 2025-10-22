<?php

namespace App\Repositories;

use App\Models\Classifications;
use Illuminate\Support\Arr;

class ClassificationRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Classifications());
    }

    public function getAllByColumns($columns = ['id', 'name', 'commision_rate'])
    {
        return $this->model->all($columns);
    }

    public function getDropdownData()
    {
        return $this->model->all()->map(function($class) {
            return [
                'name' => $class->name . ' (' . $class->commision_rate . '% Commision Rate)',
                'id'   => $class->id
            ];
        });
    }
}
