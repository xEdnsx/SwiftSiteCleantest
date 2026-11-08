<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Catálogo de tarifas (precios de referencia, no reales).
 *
 * Convención que usa la app para armar la calculadora:
 *   - tipo_item = qué se limpia (primera pregunta).
 *   - material  = variante que cambia el precio (segunda pregunta): material o tamaño.
 *   - Los extras llevan el prefijo "Extra: " y se cobran por cada unidad.
 *
 * Inicializa solo las tarifas que faltan; conserva precios y visibilidad administrativos.
 * Las tarifas antiguas y personalizadas no se modifican ni se desactivan.
 */
class TarifasItemsSeeder extends Seeder
{
    /** Cuánto sube el precio base según el material (la tela es el precio base). */
    private const FACTOR_MATERIAL = [
        'Tela' => 1.00,
        'Malla' => 1.00,
        'Microfibra' => 1.10,
        'Cuero' => 1.30,
    ];

    public function run(): void
    {
        $tarifas = [];

        // Sillas: el precio base depende de qué se limpia; el material lo ajusta.
        foreach (['Solo asiento' => 5.00, 'Asiento y respaldo' => 7.50] as $alcance => $base) {
            foreach (['Tela', 'Malla', 'Cuero'] as $material) {
                $tarifas[] = ['Sillas', 'Silla · '.mb_strtolower($alcance), $material, $this->conMaterial($base, $material)];
            }
        }

        // Muebles: precio base en tela; microfibra y cuero cuestan más.
        $muebles = [
            'Sofá de 2 plazas' => 35.00,
            'Sofá de 3 plazas' => 45.00,
            'Butaca' => 30.00,
            'Ottoman' => 15.00,
            'Tapicería de vehículo' => 13.00, // por asiento (un auto de 5 asientos = $65)
        ];
        foreach ($muebles as $tipo => $base) {
            foreach (['Tela', 'Microfibra', 'Cuero'] as $material) {
                $tarifas[] = ['Muebles', $tipo, $material, $this->conMaterial($base, $material)];
            }
        }

        // Colchones: el precio depende de la medida (la medida va en el nombre).
        $tarifas[] = ['Colchones', 'Colchón individual', null, 25.00];
        $tarifas[] = ['Colchones', 'Colchón matrimonial', null, 35.00];
        $tarifas[] = ['Colchones', 'Colchón queen', null, 40.00];
        $tarifas[] = ['Colchones', 'Colchón king', null, 45.00];

        // Baños: tipo de baño + tamaño.
        $banos = [
            'Baño completo' => ['Pequeño' => 35.00, 'Mediano' => 40.00, 'Grande' => 50.00],
            'Baño social' => ['Pequeño' => 20.00, 'Mediano' => 25.00, 'Grande' => 32.00],
        ];
        foreach ($banos as $tipo => $tamanos) {
            foreach ($tamanos as $tamano => $precio) {
                $tarifas[] = ['Baños', $tipo, $tamano, $precio];
            }
        }

        // Extras (se cobran por colchón o por baño).
        $tarifas[] = ['Colchones', 'Extra: antiácaros', null, 5.00];
        $tarifas[] = ['Colchones', 'Extra: manchas difíciles', null, 5.00];
        $tarifas[] = ['Baños', 'Extra: quitar sarro', null, 8.00];

        foreach ($tarifas as [$categoria, $tipo, $material, $precio]) {
            $idCategoria = DB::table('categorias_servicio')
                ->where('nombre', $categoria)
                ->value('id_categoria');

            if ($idCategoria === null) {
                throw new RuntimeException("No existe la categoría: {$categoria}");
            }

            $clave = [
                'id_categoria' => $idCategoria,
                'tipo_item' => $tipo,
                'material' => $material,
            ];

            if (! DB::table('tarifas_items')->where($clave)->exists()) {
                DB::table('tarifas_items')->insert($clave + ['precio_unitario' => $precio, 'activo' => 1]);
            }
        }

        // Textos de presentación (detalle, descripción) de lo que acabamos de crear.
        PresentacionCatalogo::aplicar();
    }

    /** Precio base × factor del material, redondeado a $0.50. */
    private function conMaterial(float $base, string $material): float
    {
        return round($base * self::FACTOR_MATERIAL[$material] * 2) / 2;
    }
}
