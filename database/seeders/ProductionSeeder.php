<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductionSeeder extends Seeder
{
    public $domain;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->domain = request()->getHost() ?? 'l-e-bazaar.com';
    }

    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Call pre-existing seeders
        $this->call([
            CountrySeeder::class,
            StatusSeeder::class,
            CourseTypeSeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class,
            TranslationSeeder::class
        ]);

        // Seed settings
        $this->seedSettings();

        // Seed admin user
        $this->seedAdmin();
    }

    /**
     * Seed general settings
     */
    private function seedSettings()
    {
        DB::table('settings')->truncate();

        DB::table('settings')->insert([
            [
                'name'     => 'Inquiry Receiver Email',
                'slug'     => 'inquiry-receiver-email',
                'type'     => 'text',
                'value'    => 'inquiry@' . $this->domain,
                'category' => 'email'
            ],
            [
                'name'     => 'No Reply Email',
                'slug'     => 'no-reply-email',
                'type'     => 'text',
                'value'    => 'noreply@' . $this->domain,
                'category' => 'email'
            ],
            [
                'name'     => 'Free Class Scheduling Fee (Points)',
                'slug'     => 'free-class-schedule-fee',
                'type'     => 'number',
                'category' => 'general',
                'value'    => 10
            ],
            [
                'name'     => 'Voting Duration Period (Days)',
                'slug'     => 'voting-days',
                'type'     => 'number',
                'category' => 'general',
                'value'    => 4
            ],
            [
                'name'     => 'Vote Passing Rate (%)',
                'slug'     => 'vote-passing-percentage',
                'type'     => 'number',
                'category' => 'general',
                'value'    => 75
            ],
            [
                'name'     => 'Admin Commission Rate (%)',
                'slug'     => 'admin-commission',
                'type'     => 'number',
                'value'    => 20,
                'category' => 'general'
            ],
            [
                'name'     => 'Donation Commission Rate (%)',
                'slug'     => 'donate-commission',
                'type'     => 'number',
                'category' => 'general',
                'value'    => 20
            ],
            [
                'name'     => 'Exam Passing Rate (%)',
                'slug'     => 'exam-passing-percentage',
                'type'     => 'number',
                'category' => 'general',
                'value'    => 75
            ]
        ]);
    }

    /**
     * Seed the admin user
     */
    private function seedAdmin()
    {
        $users = User::factory()
                    ->count(1)
                    ->state(new Sequence([
                        'email' => 'admin@' . $this->domain
                    ]))
                    ->create();

        $user = $users->first();

        $user->attachRole(Role::ADMIN);

        $user->userWallet()->create(['points' => 0]);
    }
}
