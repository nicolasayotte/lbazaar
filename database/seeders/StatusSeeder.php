<?php

namespace Database\Seeders;

use App\Models\Status;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $statuses = [
            Status::PENDING,
            Status::APPROVED,
            Status::DENIED,
            Status::DRAFT,
            Status::PUBLISHED,
            Status::COMPLETED
        ];

        foreach ($statuses as $status) {
            Status::updateOrCreate(['name' => $status]);
        }
    }
}
