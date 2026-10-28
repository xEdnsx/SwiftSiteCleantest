<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zonas_cobertura', function (Blueprint $table) {
            $table->increments('id_zona');

            $table->string('nombre', 100)->unique();

            $table->decimal('recargo', 10, 2)->default(0);

            $table->boolean('activo')->default(true);
        });

        DB::statement(
            'ALTER TABLE zonas_cobertura
             ADD CONSTRAINT chk_zona_recargo
             CHECK (recargo >= 0)'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('zonas_cobertura');
    }
};