<?php

namespace App\Repositories;

use App\Models\Country;

class CountryRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Country());
    }

    public function getDropdownData()
    {
        $countries = $this->model->orderBy('name', 'asc')->get();

        return $countries->map(function($country) {
            return [
                'name' => $country->name,
                'id'   => $country->id
            ];
        });
    }
}
