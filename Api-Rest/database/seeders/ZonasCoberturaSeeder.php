<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Zonas de cobertura con recargo por distancia (valores de referencia, no reales).
 *
 * Desde 2024 El Salvador se organiza en 44 municipios ("San Salvador Centro", "La Libertad Costa"…),
 * que agrupan a los antiguos municipios (ahora distritos). Cada zona se guarda como "<Departamento> <Zona>"
 * y la app la separa por departamento para que la persona elija primero dónde vive.
 *
 * Niveles:  $0 gratis · $3 cercana · $5 · $8 · $12 lejana.
 * Solo inicializa zonas inexistentes: conserva recargos y estados definidos por administración.
 */
class ZonasCoberturaSeeder extends Seeder
{
    public function run(): void
    {
        $niveles = [
            0 => ['San Salvador Centro', 'La Libertad Este', 'La Libertad Sur'],
            3 => ['San Salvador Este', 'San Salvador Oeste', 'San Salvador Sur', 'San Salvador Norte'],
            5 => ['La Libertad Centro', 'La Libertad Oeste', 'La Libertad Costa', 'La Libertad Norte', 'Cuscatlán Sur', 'La Paz Oeste'],
            8 => [
                'Cuscatlán Norte', 'La Paz Centro', 'La Paz Este', 'San Vicente Norte', 'San Vicente Sur', 'Cabañas Este', 'Cabañas Oeste',
                'Sonsonate Centro', 'Sonsonate Este', 'Sonsonate Norte', 'Sonsonate Oeste', 'Chalatenango Sur',
            ],
            12 => [
                'Santa Ana Centro', 'Santa Ana Este', 'Santa Ana Oeste', 'Santa Ana Norte',
                'Ahuachapán Centro', 'Ahuachapán Norte', 'Ahuachapán Sur', 'Chalatenango Centro', 'Chalatenango Norte',
                'Usulután Este', 'Usulután Norte', 'Usulután Oeste', 'San Miguel Centro', 'San Miguel Norte', 'San Miguel Oeste',
                'Morazán Norte', 'Morazán Sur', 'La Unión Norte', 'La Unión Sur',
            ],
        ];

        foreach ($niveles as $recargo => $nombres) {
            foreach ($nombres as $nombre) {
                if (! DB::table('zonas_cobertura')->where('nombre', $nombre)->exists()) {
                    DB::table('zonas_cobertura')->insert(['nombre' => $nombre, 'recargo' => $recargo, 'activo' => 1]);
                }
            }
        }

    }
}
