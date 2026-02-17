<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Modify the status column to add 'canceled' to the enum
        DB::statement("ALTER TABLE stripe_payments MODIFY COLUMN status ENUM('pending', 'succeeded', 'failed', 'refunded', 'canceled') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Remove 'canceled' from the enum (note: this will fail if any records have 'canceled' status)
        DB::statement("ALTER TABLE stripe_payments MODIFY COLUMN status ENUM('pending', 'succeeded', 'failed', 'refunded') NOT NULL DEFAULT 'pending'");
    }
};
