<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Constancia de que la persona aceptó los Términos y la Política de Privacidad:
 * qué versión del texto y cuándo. Queda vacío para cuentas anteriores o creadas por el administrador.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('terminos_version', 20)->nullable()->after('password_hash');
            $table->dateTime('terminos_aceptados_en')->nullable()->after('terminos_version');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn(['terminos_version', 'terminos_aceptados_en']);
        });
    }
};
