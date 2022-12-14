<?php

namespace App\Repositories;

use App\Models\Setting;

class SettingRepository extends BaseRepository
{

    public function __construct()
    {
        parent::__construct(new Setting());
    }

    public function getSetting($slug)
    {
        $setting = $this->model->where('slug', $slug)->first();

        return @$setting ? @$setting->value : null;
    }
}
