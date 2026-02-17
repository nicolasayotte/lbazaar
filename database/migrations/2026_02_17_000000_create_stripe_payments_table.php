<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stripe_payments', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id')->unsigned()->index();
            $table->bigInteger('course_id')->unsigned()->index();
            $table->bigInteger('course_history_id')->unsigned()->nullable()->index();
            $table->string('stripe_payment_intent_id')->unique();
            $table->string('stripe_customer_id')->nullable()->index();
            $table->integer('amount'); // JPY is zero-decimal: ¥1000 = 1000
            $table->string('currency', 3)->default('jpy');
            $table->enum('status', ['pending', 'succeeded', 'failed', 'refunded'])->default('pending')->index();
            $table->text('receipt_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('course_history_id')->references('id')->on('course_histories')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stripe_payments');
    }
};
