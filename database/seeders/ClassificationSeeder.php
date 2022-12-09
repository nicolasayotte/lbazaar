<?php

namespace Database\Seeders;

use App\Models\Classifications;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClassificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('classifications')->insert([
            [
                'name' => 'A',
                'commision_rate' => 30
            ],
            [
                'name' => 'B',
                'commision_rate' => 20
            ],
            [
                'name' => 'C',
                'commision_rate' => 10
            ]
        ]);
    }
}
