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
        Schema::table('nft_transactions', function (Blueprint $table) {
            // Add new columns needed for certificate minting
            $table->string('tx_id')->nullable()->after('used');
            $table->string('mph')->nullable()->after('tx_id');
            $table->text('metadata')->nullable()->after('mph');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('nft_transactions', function (Blueprint $table) {
            $table->dropColumn(['metadata', 'mph', 'tx_id']);
        });
    }
};
