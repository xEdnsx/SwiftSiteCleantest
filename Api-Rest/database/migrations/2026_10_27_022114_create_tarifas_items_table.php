<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarifas_items', function (Blueprint $table) {
            $table->increments('id_tarifa');

            $table->unsignedInteger('id_categoria');

            $table->string('tipo_item', 100);

            $table->string('material', 80)->nullable();

            $table->decimal('precio_unitario', 10, 2);

            $table->boolean('activo')->default(true);

            $table->foreign('id_categoria')
                ->references('id_categoria')
                ->on('categorias_servicio')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
        });

        DB::statement(
            'ALTER TABLE tarifas_items
             ADD CONSTRAINT chk_tarifa_precio
             CHECK (precio_unitario >= 0)'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('tarifas_items');
    }
};