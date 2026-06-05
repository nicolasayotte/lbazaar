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
            ],
            // vote-passing-percentage and donate-commission are also `required` by
            // AdminSettingsRequest — without them the admin "General Settings" form
            // cannot be saved at all (the whole batch fails validation). Seed them here
            // so a fresh DB has the complete required set (values match ProductionSeeder).
            [
                'name'     => 'Vote Passing Rate (%)',
                'slug'     => 'vote-passing-percentage',
                'type'     => 'number',
                'value'    => '75',
                'category' => 'general'
            ],
            [
                'name'     => 'Donation Commission Rate (%)',
                'slug'     => 'donate-commission',
                'type'     => 'number',
                'value'    => '20',
                'category' => 'general'
            ]
        ]);
    }
}
