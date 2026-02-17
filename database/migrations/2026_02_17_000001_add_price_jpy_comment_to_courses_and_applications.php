<?php

use Illuminate\Database\Migrations\Migration;
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
        DB::statement("ALTER TABLE courses MODIFY COLUMN price DOUBLE NULL COMMENT 'Price in Japanese Yen (JPY)'");
        DB::statement("ALTER TABLE course_applications MODIFY COLUMN price DOUBLE NULL COMMENT 'Price in Japanese Yen (JPY)'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement("ALTER TABLE courses MODIFY COLUMN price DOUBLE NULL");
        DB::statement("ALTER TABLE course_applications MODIFY COLUMN price DOUBLE NULL");
    }
};
