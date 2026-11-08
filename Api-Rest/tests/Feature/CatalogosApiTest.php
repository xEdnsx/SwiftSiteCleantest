<?php

namespace Tests\Feature;

use App\Models\CategoriaServicio;
use App\Models\Rol;
use App\Models\TarifaItem;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CatalogosApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The production migrations add CHECK constraints with MySQL-only ALTER syntax.
        // Use their table definitions on SQLite, plus equivalent checks for these catalogs.
        foreach (['roles', 'usuarios', 'categorias_servicio'] as $table) {
            $file = glob(database_path("migrations/*_create_{$table}_table.php"))[0];
            (require $file)->up();
        }
        DB::statement('CREATE TABLE tarifas_items (id_tarifa INTEGER PRIMARY KEY AUTOINCREMENT, id_categoria INTEGER NOT NULL REFERENCES categorias_servicio(id_categoria), tipo_item VARCHAR(100) NOT NULL, material VARCHAR(80), precio_unitario DECIMAL(10,2) NOT NULL CHECK(precio_unitario >= 0), activo BOOLEAN NOT NULL DEFAULT 1)');
        DB::statement('CREATE TABLE zonas_cobertura (id_zona INTEGER PRIMARY KEY AUTOINCREMENT, nombre VARCHAR(100) NOT NULL UNIQUE, recargo DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK(recargo >= 0), activo BOOLEAN NOT NULL DEFAULT 1)');
        DB::statement('CREATE TABLE detalle_pedidos (id_detalle INTEGER PRIMARY KEY, id_tarifa INTEGER NOT NULL REFERENCES tarifas_items(id_tarifa))');
        DB::statement('CREATE TABLE pedidos (id_pedido INTEGER PRIMARY KEY, id_zona INTEGER NOT NULL REFERENCES zonas_cobertura(id_zona))');
        (require glob(database_path('migrations/*_add_presentacion_to_catalogo.php'))[0])->up();
    }

    private function authenticate(string $role = 'Administrador'): void
    {
        $rol = Rol::create(['nombre_rol' => $role]);
        Sanctum::actingAs(Usuario::create([
            'id_rol' => $rol->getKey(), 'nombre' => 'Prueba', 'correo' => 'prueba@example.com',
        ]));
    }

    public function test_public_reads_and_json_errors_without_accept_header(): void
    {
        CategoriaServicio::create(['nombre' => 'Sillas']);
        CategoriaServicio::create(['nombre' => 'Inactiva', 'activo' => false]);
        $this->get('/api/categorias?activo=1')->assertOk()->assertJsonCount(1)->assertJsonPath('0.nombre', 'Sillas');
        $this->get('/api/categorias/999')->assertNotFound()->assertHeader('Content-Type', 'application/json');
        $this->get('/api/zonas?activo=invalid')->assertUnprocessable()->assertJsonValidationErrors('activo');
        $this->post('/api/categorias', ['nombre' => 'Otra'])->assertUnauthorized()->assertHeader('Content-Type', 'application/json');
    }

    public function test_clients_cannot_manage_catalogs(): void
    {
        $this->authenticate('Cliente');
        $this->postJson('/api/zonas', ['nombre' => 'Centro'])->assertForbidden();
    }

    public function test_administrator_can_manage_all_three_catalogs(): void
    {
        $this->authenticate();
        $categoria = $this->postJson('/api/categorias', ['nombre' => 'Sillas'])->assertCreated()->json('id_categoria');
        $this->postJson('/api/categorias', ['nombre' => 'Sillas'])->assertUnprocessable();
        $this->patchJson("/api/categorias/$categoria", ['descripcion' => 'Limpieza'])->assertOk()->assertJsonPath('nombre', 'Sillas');
        $this->patchJson("/api/categorias/$categoria", ['nombre' => null])->assertUnprocessable();

        $tarifa = $this->postJson('/api/tarifas', [
            'id_categoria' => $categoria, 'tipo_item' => 'Silla', 'precio_unitario' => '12.50',
        ])->assertCreated()->assertJsonPath('precio_unitario', '12.50')->json('id_tarifa');
        $this->getJson("/api/tarifas?id_categoria=$categoria")->assertOk()->assertJsonCount(1);
        $this->getJson("/api/tarifas/$tarifa")->assertOk();
        $this->patchJson("/api/tarifas/$tarifa", ['precio_unitario' => -1])->assertUnprocessable();
        $this->patchJson("/api/tarifas/$tarifa", ['precio_unitario' => 20])->assertOk()->assertJsonPath('precio_unitario', '20.00');
        $this->deleteJson("/api/categorias/$categoria")->assertConflict();

        $zona = $this->postJson('/api/zonas', ['nombre' => 'Centro'])->assertCreated()->assertJsonPath('recargo', '0.00')->json('id_zona');
        $this->getJson("/api/zonas/$zona")->assertOk();
        $this->patchJson("/api/zonas/$zona", ['recargo' => '3.50', 'activo' => false])->assertOk()->assertJsonPath('activo', false);
        $this->deleteJson("/api/zonas/$zona")->assertNoContent();
        $this->deleteJson("/api/tarifas/$tarifa")->assertNoContent();
        $this->deleteJson("/api/categorias/$categoria")->assertNoContent();
    }

    public function test_referenced_tariffs_and_zones_cannot_be_deleted(): void
    {
        $this->authenticate();
        $categoria = CategoriaServicio::create(['nombre' => 'Sillas']);
        $tarifa = TarifaItem::create(['id_categoria' => $categoria->getKey(), 'tipo_item' => 'Silla', 'precio_unitario' => 10]);
        DB::table('detalle_pedidos')->insert(['id_detalle' => 1, 'id_tarifa' => $tarifa->getKey()]);
        $this->deleteJson('/api/tarifas/'.$tarifa->getKey())->assertConflict();
        $zona = $this->postJson('/api/zonas', ['nombre' => 'Centro'])->json('id_zona');
        DB::table('pedidos')->insert(['id_pedido' => 1, 'id_zona' => $zona]);
        $this->deleteJson("/api/zonas/$zona")->assertConflict();
    }
}
