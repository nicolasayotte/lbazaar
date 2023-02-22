<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class UserWalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('badges')->insert([
            [
                'name' => 'Single class completion badge',
                'type' => Role::STUDENT,
            ],
            [
                'name' => 'Package class completion badge',
                'type' => Role::STUDENT,
            ],
            [
                'name' => '10 Students booked badge',
                'type' => Role::TEACHER,
            ],
            [
                'name' => '5 Students booked badge',
                'type' => Role::TEACHER,
            ],
        ]);
    }
}
