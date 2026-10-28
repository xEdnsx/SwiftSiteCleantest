<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriasServicioSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Sillas', 'Muebles', 'Colchones', 'Baños'] as $categoria) {
            DB::table('categorias_servicio')->updateOrInsert(
                ['nombre' => $categoria],
                ['descripcion' => 'Servicio de limpieza de ' . $categoria, 'activo' => 1]
            );
        }
    }
}