<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias_servicio', function (Blueprint $table) {
            $table->increments('id_categoria');

            $table->string('nombre', 80)->unique();

            $table->string('descripcion', 300)->nullable();

            $table->boolean('activo')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categorias_servicio');
    }
};