<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN certificate_status " .
            "ENUM('not_eligible','eligible','pending','minting','minted','self_minted','failed','revoked') NULL"
        );
    }

    public function down(): void
    {
        DB::statement(
            "UPDATE course_histories SET certificate_status = 'minted' WHERE certificate_status = 'self_minted'"
        );
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN certificate_status " .
            "ENUM('not_eligible','eligible','pending','minting','minted','failed','revoked') NULL"
        );
    }
};
