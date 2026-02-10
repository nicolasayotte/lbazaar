<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        foreach (Permission::SCOPES as $scope) {
            foreach (Permission::ACTIONS as $action) {
                Permission::firstOrCreate([
                    'name' => $action . '-' . $scope
                ]);
            }
        }
    }
}
