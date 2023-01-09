<?php

namespace App\Repositories;

use App\Models\Classifications;

class ClassificationRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Classifications());
    }

    public function getDropdownData()
    {
        $classifications = $this->model->get();

        return $classifications->map(function($class) {
            return [
                'name' => $class->name . ' (' . $class->commision_rate . '% Commision Rate)',
                'id'   => $class->id
            ];
        });
    }
}
