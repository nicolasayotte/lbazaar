<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private $settingsToAdd = [
        [
            'name'     => 'Voting Days',
            'slug'     => 'voting-days',
            'type'     => 'number',
            'category' => 'general',
            'value'    => 4
        ],
        [
            'name'     => 'Vote Passing Percentage',
            'slug'     => 'vote-passing-percentage',
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
