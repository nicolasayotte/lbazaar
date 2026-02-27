<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('certificate_name')->nullable()->after('certificate_enabled');
            $table->text('certificate_description')->nullable()->after('certificate_name');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['certificate_name', 'certificate_description']);
        });
    }
};
