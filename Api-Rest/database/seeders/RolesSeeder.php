<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Cliente', 'Administrador'] as $rol) {
            DB::table('roles')->updateOrInsert(
                ['nombre_rol' => $rol],
                ['nombre_rol' => $rol]
            );
        }
    }
}