<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private $settingsToAdd = [
        [
            'name' => 'Ada to Points',
            'slug' => 'ada-to-points',
            'category' => 'general',
            'type' => 'number',
            'value' => 10
        ]
    ];

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        foreach ($this->settingsToAdd as $setting) {
            $existingSetting = Setting::where('slug', $setting['slug'])->first();

            if (!$existingSetting) {
                Setting::create($setting);
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        foreach ($this->settingsToAdd as $setting) {
            $existingSetting = Setting::where('slug', $setting['slug'])->first();

            if ($existingSetting) {
                $existingSetting->delete();
            }
        }
    }
};
