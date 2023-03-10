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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->longText('discord_id')->nullable();
            $table->string('image')->nullable();
            $table->string('university')->nullable();
            $table->longText('about')->nullable();
            $table->longText('specialty')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->bigInteger('country_id')->unsigned()->index();
            $table->string('password');
            $table->boolean('is_temp_password')->nullable();
            $table->boolean('is_enabled')->nullable();
            $table->bigInteger('classification_id')->unsigned()->index()->nullable();
            $table->bigInteger('commission_rate')->nullable();
            $table->bigInteger('commission_earn_rate')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            $table->bigInteger('deleted_by')->unsigned()->index()->nullable();

            $table->foreign('deleted_by')->references('id')->on('users');
            $table->foreign('classification_id')->references('id')->on('classifications');
            $table->foreign('country_id')->references('id')->on('countries');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
};
