<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Add certificate_enabled to course_applications table
        Schema::table('course_applications', function (Blueprint $table) {
            $table->boolean('certificate_enabled')->default(false)->after('data');
        });

        // Add certificate_enabled to courses table
        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('certificate_enabled')->default(false)->after('days_before_cancellation');
        });

        // Add certificate fields to course_histories table
        Schema::table('course_histories', function (Blueprint $table) {
            $table->enum('certificate_status', ['eligible', 'minting', 'minted', 'failed'])
                ->nullable()
                ->after('is_watched');
            $table->string('certificate_tx_hash', 64)->nullable()->after('certificate_status');
            $table->timestamp('certificate_minted_at')->nullable()->after('certificate_tx_hash');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('course_applications', function (Blueprint $table) {
            $table->dropColumn('certificate_enabled');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('certificate_enabled');
        });

        Schema::table('course_histories', function (Blueprint $table) {
            $table->dropColumn(['certificate_status', 'certificate_tx_hash', 'certificate_minted_at']);
        });
    }
};
