<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Monarobase\CountryList\CountryList;

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $countryList = new CountryList();

        $countries = [];

        foreach ($countryList->getList() as $countryCode => $country) {
            $countries[] = [
                'code' => $countryCode,
                'name' => $country
            ];
        }

        DB::table('countries')->insert($countries);
    }
}
