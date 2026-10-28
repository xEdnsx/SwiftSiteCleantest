<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('detalle_pedidos', function (Blueprint $table) {
            $table->increments('id_detalle');

            $table->unsignedInteger('id_pedido');

            $table->unsignedInteger('id_tarifa');

            $table->integer('cantidad');

            $table->decimal('precio_unitario', 10, 2);

            $table->decimal('subtotal', 10, 2);

            $table->foreign('id_pedido')
                ->references('id_pedido')
                ->on('pedidos')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreign('id_tarifa')
                ->references('id_tarifa')
                ->on('tarifas_items')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
        });

        DB::statement(
            'ALTER TABLE detalle_pedidos
             ADD CONSTRAINT chk_detalle_cantidad
             CHECK (cantidad > 0)'
        );

        DB::statement(
            'ALTER TABLE detalle_pedidos
             ADD CONSTRAINT chk_detalle_montos
             CHECK (
                 precio_unitario >= 0
                 AND subtotal >= 0
             )'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_pedidos');
    }
};