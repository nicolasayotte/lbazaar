<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class PaymentSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Setting::updateOrCreate(
            ['slug' => 'ada-to-jpy'],
            [
                'name' => 'ADA to JPY Exchange Rate',
                'value' => '50',
                'type' => 'decimal',
                'category' => 'payment'
            ]
        );

        Setting::updateOrCreate(
            ['slug' => 'admin-commission'],
            [
                'name' => 'Admin Commission Rate',
                'value' => '20',
                'type' => 'decimal',
                'category' => 'payment'
            ]
        );
    }
}
