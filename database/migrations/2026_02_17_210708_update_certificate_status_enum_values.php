<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add 'not_eligible' and 'pending' to the certificate_status ENUM
     * on course_histories table.
     */
    public function up()
    {
        DB::statement("ALTER TABLE course_histories MODIFY COLUMN certificate_status ENUM('not_eligible', 'eligible', 'pending', 'minting', 'minted', 'failed') NULL DEFAULT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        DB::statement("ALTER TABLE course_histories MODIFY COLUMN certificate_status ENUM('eligible', 'minting', 'minted', 'failed') NULL DEFAULT NULL");
    }
};
