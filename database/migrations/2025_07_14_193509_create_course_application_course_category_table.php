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
        Schema::create('course_category_course_application', function (Blueprint $table) {
            $table->foreignId('course_application_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('course_category_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->primary(['course_application_id', 'course_category_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_category_course_application');
    }
};
