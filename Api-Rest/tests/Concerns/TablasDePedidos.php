<?php

namespace Tests\Concerns;

use Illuminate\Support\Facades\DB;

/**
 * Arma en SQLite las tablas que usan los pedidos.
 * Las migraciones reales llevan CHECK con sintaxis solo de MySQL, así que aquí va el equivalente.
 */
trait TablasDePedidos
{
    protected function armarTablasDePedidos(): void
    {
        foreach (['roles', 'usuarios', 'personal_access_tokens', 'categorias_servicio'] as $table) {
            (require glob(database_path("migrations/*_create_{$table}_table.php"))[0])->up();
        }
        DB::statement('CREATE TABLE tarifas_items (id_tarifa INTEGER PRIMARY KEY AUTOINCREMENT, id_categoria INTEGER NOT NULL REFERENCES categorias_servicio(id_categoria), tipo_item VARCHAR(100) NOT NULL, material VARCHAR(80), precio_unitario DECIMAL(10,2) NOT NULL, activo BOOLEAN NOT NULL DEFAULT 1)');
        DB::statement('CREATE TABLE zonas_cobertura (id_zona INTEGER PRIMARY KEY AUTOINCREMENT, nombre VARCHAR(100) NOT NULL UNIQUE, recargo DECIMAL(10,2) NOT NULL DEFAULT 0, activo BOOLEAN NOT NULL DEFAULT 1)');
        DB::statement("CREATE TABLE pedidos (id_pedido INTEGER PRIMARY KEY AUTOINCREMENT, id_usuario INTEGER NULL REFERENCES usuarios(id_usuario), id_zona INTEGER NOT NULL REFERENCES zonas_cobertura(id_zona), direccion VARCHAR(250) NOT NULL, fecha_servicio DATE NOT NULL, franja_horaria VARCHAR(60) NOT NULL, fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP, estado VARCHAR(20) NOT NULL DEFAULT 'Cotizado' CHECK(estado IN ('Cotizado','Confirmado','En proceso','Finalizado')), subtotal DECIMAL(10,2) NOT NULL DEFAULT 0, recargo_zona DECIMAL(10,2) NOT NULL DEFAULT 0, total DECIMAL(10,2) NOT NULL DEFAULT 0)");
        DB::statement('CREATE TABLE detalle_pedidos (id_detalle INTEGER PRIMARY KEY AUTOINCREMENT, id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido), id_tarifa INTEGER NOT NULL REFERENCES tarifas_items(id_tarifa), cantidad INTEGER NOT NULL CHECK(cantidad > 0), precio_unitario DECIMAL(10,2) NOT NULL, subtotal DECIMAL(10,2) NOT NULL)');
        (require glob(database_path('migrations/*_add_presentacion_to_catalogo.php'))[0])->up();
        (require glob(database_path('migrations/*_add_consentimiento_to_usuarios.php'))[0])->up();
        (require glob(database_path('migrations/*_permitir_cliente_sin_correo.php'))[0])->up();
        (require glob(database_path('migrations/*_create_reportes_table.php'))[0])->up();
        (require glob(database_path('migrations/*_create_valoraciones_table.php'))[0])->up();
    }
}
