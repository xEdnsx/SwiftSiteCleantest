<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriasServicioSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Sillas', 'Muebles', 'Colchones', 'Baños'] as $categoria) {
            // Solo crea lo que falta: no pisa lo que el administrador ya editó u ocultó.
            DB::table('categorias_servicio')->insertOrIgnore([
                'nombre' => $categoria,
                'descripcion' => 'Servicio de limpieza de ' . $categoria,
                'activo' => 1,
            ]);
        }

        // Ícono, preguntas y notas con que la app muestra cada servicio.
        PresentacionCatalogo::aplicar();
    }
}