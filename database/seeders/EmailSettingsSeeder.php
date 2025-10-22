<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmailSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('settings')->insert([
            [
                'name'     => 'Inquiry Receiver Email',
                'slug'     => 'inquiry-receiver-email',
                'type'     => 'text',
                'value'    => 'inquiry@l-e-bazaar.com',
                'category' => 'email'
            ],
            [
                'name'     => 'No Reply Email Generator',
                'slug'     => 'no-reply-email',
                'type'     => 'text',
                'value'    => 'noreply@l-e-bazaar.com',
                'category' => 'email'
            ],
            [
                'name'     => 'Admin Commission',
                'slug'     => 'admin-commission',
                'type'     => 'number',
                'value'    => '20',
                'category' => 'general'
            ]
        ]);
    }
}
