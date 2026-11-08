<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Un cliente que se agrega desde el panel puede no tener correo (solo teléfono).
 * El correo sigue siendo único; en MySQL varios registros sin correo (NULL) no chocan entre sí.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('correo', 150)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Para volver atrás, los clientes sin correo reciben uno provisional y único.
        DB::table('usuarios')->whereNull('correo')->update(['correo' => DB::raw("CONCAT('sin-correo-', id_usuario, '@invalido.local')")]);

        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('correo', 150)->nullable(false)->change();
        });
    }
};
