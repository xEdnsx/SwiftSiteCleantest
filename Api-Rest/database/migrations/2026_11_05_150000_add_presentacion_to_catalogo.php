<?php

use Database\Seeders\PresentacionCatalogo;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cómo se muestra cada servicio en la app (ícono, preguntas, notas), guardado en la base de datos
 * para que un servicio nuevo creado en el panel aparezca completo sin tocar código.
 * Todo es opcional: si una columna está vacía, la app usa un texto genérico.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categorias_servicio', function (Blueprint $table) {
            $table->string('icono', 30)->nullable()->after('descripcion');
            $table->string('pregunta_tipo', 80)->nullable()->after('icono');
            $table->string('pregunta_variante', 80)->nullable()->after('pregunta_tipo');
            $table->string('pregunta_cantidad', 80)->nullable()->after('pregunta_variante');
            $table->string('unidad', 40)->nullable()->after('pregunta_cantidad');
            $table->string('nota', 300)->nullable()->after('unidad');
            $table->unsignedSmallInteger('cantidad_max')->nullable()->after('nota');
        });

        Schema::table('tarifas_items', function (Blueprint $table) {
            // Texto corto bajo la opción: "90 × 190 cm", "hasta 4 m²".
            $table->string('detalle', 80)->nullable()->after('material');
            // Qué incluye este servicio.
            $table->string('descripcion', 200)->nullable()->after('detalle');
        });

        // Los 4 servicios que ya existían conservan los textos que la app mostraba antes.
        PresentacionCatalogo::aplicar();
    }

    public function down(): void
    {
        Schema::table('tarifas_items', function (Blueprint $table) {
            $table->dropColumn(['detalle', 'descripcion']);
        });

        Schema::table('categorias_servicio', function (Blueprint $table) {
            $table->dropColumn(['icono', 'pregunta_tipo', 'pregunta_variante', 'pregunta_cantidad', 'unidad', 'nota', 'cantidad_max']);
        });
    }
};
