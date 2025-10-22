<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAddressToUserWallets extends Migration
{
    public function up()
    {
        Schema::table('user_wallets', function (Blueprint $table) {
            $table->string('address')->nullable()->after('stake_key_hash');
        });
    }

    public function down()
    {
        Schema::table('user_wallets', function (Blueprint $table) {
            $table->dropColumn('address');
        });
    }
}
