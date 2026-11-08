<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('valoraciones', function (Blueprint $table) {
            $table->increments('id_valoracion');

            // Una valoración por pedido.
            $table->unsignedInteger('id_pedido')->unique();

            $table->unsignedInteger('id_usuario');

            // De 1 a 5 (lo valida la API).
            $table->unsignedTinyInteger('estrellas');

            // Lista de aspectos que el cliente marcó (Puntualidad, Limpieza…).
            $table->json('aspectos')->nullable();

            $table->string('comentario', 500)->nullable();

            // Solo se muestran al público las que el administrador publica.
            $table->enum('estado', [
                'Pendiente',
                'Publicada',
                'Oculta',
            ])->default('Pendiente');

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

            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('valoraciones');
    }
};
