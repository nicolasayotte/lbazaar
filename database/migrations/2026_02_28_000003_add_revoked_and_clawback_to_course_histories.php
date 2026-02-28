<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN certificate_status " .
            "ENUM('not_eligible','eligible','pending','minting','minted','failed','revoked') NULL"
        );
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN token_reward_status " .
            "ENUM('eligible','minting','minted','failed','clawback_flagged') NULL"
        );
    }

    public function down(): void
    {
        DB::statement(
            "UPDATE course_histories SET certificate_status = 'failed' WHERE certificate_status = 'revoked'"
        );
        DB::statement(
            "UPDATE course_histories SET token_reward_status = 'failed' WHERE token_reward_status = 'clawback_flagged'"
        );
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN certificate_status " .
            "ENUM('not_eligible','eligible','pending','minting','minted','failed') NULL"
        );
        DB::statement(
            "ALTER TABLE course_histories MODIFY COLUMN token_reward_status " .
            "ENUM('eligible','minting','minted','failed') NULL"
        );
    }
};
