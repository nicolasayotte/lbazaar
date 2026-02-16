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
        Schema::table('course_histories', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'confirmed', 'failed'])
                ->nullable()
                ->after('is_cancelled');
            $table->string('payment_tx_hash')->nullable()->after('payment_status');
            $table->decimal('payment_ada_amount', 20, 6)->nullable()->after('payment_tx_hash');
            $table->timestamp('payment_submitted_at')->nullable()->after('payment_ada_amount');
            $table->timestamp('payment_confirmed_at')->nullable()->after('payment_submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('course_histories', function (Blueprint $table) {
            $table->dropColumn([
                'payment_status',
                'payment_tx_hash',
                'payment_ada_amount',
                'payment_submitted_at',
                'payment_confirmed_at'
            ]);
        });
    }
};
