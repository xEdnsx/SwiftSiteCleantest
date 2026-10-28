<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->increments('id_pedido');

            // Puede ser NULL para cotizaciones invitadas.
            $table->unsignedInteger('id_usuario')->nullable();

            $table->unsignedInteger('id_zona');

            $table->string('direccion', 250);

            $table->date('fecha_servicio');

            $table->string('franja_horaria', 60);

            $table->dateTime('fecha_creacion')
                ->useCurrent();

            $table->enum('estado', [
                'Cotizado',
                'Confirmado',
                'En proceso',
                'Finalizado'
            ])->default('Cotizado');

            $table->decimal('subtotal', 10, 2)->default(0);

            $table->decimal('recargo_zona', 10, 2)->default(0);

            $table->decimal('total', 10, 2)->default(0);

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreign('id_zona')
                ->references('id_zona')
                ->on('zonas_cobertura')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
        });

        DB::statement(
            'ALTER TABLE pedidos
             ADD CONSTRAINT chk_pedido_montos
             CHECK (
                 subtotal >= 0
                 AND recargo_zona >= 0
                 AND total >= 0
             )'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};