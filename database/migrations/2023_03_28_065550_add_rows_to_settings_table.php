<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private $settingsToAdd = [
        [
            'name'     => 'Free class - Schedule Fee',
            'slug'     => 'free-class-schedule-fee',
            'type'     => 'number',
            'category' => 'general',
            'value'    => 10
        ],
        [
            'name'     => 'Donate Commission %',
            'slug'     => 'donate-commission',
            'type'     => 'number',
            'category' => 'general',
            'value'    => 20
        ],
        [
            'name'     => 'Class exam passing %',
            'slug'     => 'exam-passing-percentage',
            'type'     => 'number',
            'category' => 'general',
            'value'    => 75
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
