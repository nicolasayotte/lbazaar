<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_histories', function (Blueprint $table) {
            $table->string('enrolled_certificate_image_url', 2048)
                ->nullable()
                ->after('enrolled_certificate_description');
        });
    }
    public function down(): void
    {
        Schema::table('course_histories', function (Blueprint $table) {
            $table->dropColumn('enrolled_certificate_image_url');
        });
    }
};
