<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TarifasItemsSeeder extends Seeder
{
    public function run(): void
    {
        $tarifas = [
            ['Sillas', 'Silla individual', 'Tela', 10.00],
            ['Sillas', 'Silla individual', 'Cuero', 12.00],
            ['Muebles', 'Sofá de 2 plazas', 'Tela', 35.00],
            ['Muebles', 'Sofá de 3 plazas', 'Microfibra', 45.00],
            ['Colchones', 'Colchón individual', null, 25.00],
            ['Colchones', 'Colchón matrimonial', null, 40.00],
            ['Baños', 'Limpieza de baño', null, 30.00],
        ];

        foreach ($tarifas as [$categoria, $tipo, $material, $precio]) {
            $idCategoria = DB::table('categorias_servicio')
                ->where('nombre', $categoria)
                ->value('id_categoria');

            if ($idCategoria === null) {
                throw new RuntimeException(
                    "No existe la categoría: {$categoria}"
                );
            }

            DB::table('tarifas_items')->updateOrInsert(
                [
                    'id_categoria' => $idCategoria,
                    'tipo_item' => $tipo,
                    'material' => $material,
                ],
                [
                    'precio_unitario' => $precio,
                    'activo' => 1,
                ]
            );
        }
    }
}