<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reportes', function (Blueprint $table) {
            $table->increments('id_reporte');

            $table->unsignedInteger('id_pedido');

            $table->unsignedInteger('id_usuario');

            $table->enum('motivo', [
                'Limpieza incompleta',
                'Daño en mi pertenencia',
                'Llegaron tarde',
                'Cobro incorrecto',
                'Trato del personal',
                'Otro',
            ]);

            $table->string('descripcion', 500);

            $table->enum('estado', [
                'Recibido',
                'En revisión',
                'Resuelto',
            ])->default('Recibido');

            // Respuesta del equipo (la llena el panel administrativo).
            $table->string('respuesta', 500)->nullable();

            $table->dateTime('fecha_creacion')->useCurrent();

            $table->dateTime('fecha_actualizacion')->nullable();

            $table->foreign('id_pedido')
                ->references('id_pedido')
                ->on('pedidos')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->index(['id_usuario', 'fecha_creacion']);
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reportes');
    }
};
