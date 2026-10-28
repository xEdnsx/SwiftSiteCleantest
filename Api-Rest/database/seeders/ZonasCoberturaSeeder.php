<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZonasCoberturaSeeder extends Seeder
{
    public function run(): void
    {
        $zonas = [
            'Santa Tecla',
            'San Salvador Centro',
            'Soyapango',
        ];

        foreach ($zonas as $zona) {
            DB::table('zonas_cobertura')->updateOrInsert(
                ['nombre' => $zona],
                ['recargo' => 0.00, 'activo' => 1]
            );
        }
    }
}