<?php

namespace Tests\Feature;

use Database\Seeders\ZonasCoberturaSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ZonasSeederTest extends TestCase
{
    public function test_seed_initializes_missing_zones_without_changing_existing_prices_or_visibility(): void
    {
        Schema::create('zonas_cobertura', function (Blueprint $table) {
            $table->increments('id_zona');
            $table->string('nombre')->unique();
            $table->decimal('recargo', 10, 2)->default(0);
            $table->boolean('activo')->default(true);
        });
        DB::table('zonas_cobertura')->insert([
            ['nombre' => 'San Salvador Centro', 'recargo' => '17.25', 'activo' => false],
            ['nombre' => 'Zona personalizada', 'recargo' => '9.50', 'activo' => true],
            ['nombre' => 'Zona oculta', 'recargo' => '8.00', 'activo' => false],
        ]);
        $this->seed(ZonasCoberturaSeeder::class);
        $snapshot = DB::table('zonas_cobertura')->orderBy('id_zona')->get()->toJson();
        $this->assertSame(46, DB::table('zonas_cobertura')->count());
        $this->assertDatabaseHas('zonas_cobertura', ['nombre' => 'San Salvador Centro', 'recargo' => '17.25', 'activo' => false]);
        $this->assertDatabaseHas('zonas_cobertura', ['nombre' => 'Zona personalizada', 'activo' => true]);
        $this->assertDatabaseHas('zonas_cobertura', ['nombre' => 'Zona oculta', 'activo' => false]);
        $this->assertDatabaseHas('zonas_cobertura', ['nombre' => 'La Libertad Costa', 'recargo' => 5, 'activo' => true]);
        $this->seed(ZonasCoberturaSeeder::class);
        $this->assertSame($snapshot, DB::table('zonas_cobertura')->orderBy('id_zona')->get()->toJson());
    }
}
