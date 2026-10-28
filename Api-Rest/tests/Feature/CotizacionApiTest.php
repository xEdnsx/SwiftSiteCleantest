<?php

namespace Tests\Feature;

use App\Models\CategoriaServicio;
use App\Models\TarifaItem;
use App\Models\ZonaCobertura;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CotizacionApiTest extends TestCase
{
    private CategoriaServicio $categoria;

    private TarifaItem $tarifa;

    private ZonaCobertura $zona;

    protected function setUp(): void
    {
        parent::setUp();
        (require glob(database_path('migrations/*_create_categorias_servicio_table.php'))[0])->up();
        DB::statement('CREATE TABLE tarifas_items (id_tarifa INTEGER PRIMARY KEY AUTOINCREMENT, id_categoria INTEGER NOT NULL, tipo_item TEXT NOT NULL, material TEXT, precio_unitario DECIMAL(10,2) NOT NULL, activo BOOLEAN NOT NULL DEFAULT 1)');
        DB::statement('CREATE TABLE zonas_cobertura (id_zona INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, recargo DECIMAL(10,2) NOT NULL DEFAULT 0, activo BOOLEAN NOT NULL DEFAULT 1)');
        $this->categoria = CategoriaServicio::create(['nombre' => 'Prueba']);
        $this->tarifa = TarifaItem::create(['id_categoria' => $this->categoria->getKey(), 'tipo_item' => 'Silla', 'precio_unitario' => '0.10']);
        $this->zona = ZonaCobertura::create(['nombre' => 'Centro', 'recargo' => '0.20']);
    }

    private function payload(): array
    {
        return ['id_zona' => $this->zona->getKey(), 'items' => [['id_tarifa' => $this->tarifa->getKey(), 'cantidad' => 3]]];
    }

    public function test_guest_quote_uses_database_prices_and_exact_cents(): void
    {
        $this->postJson('/api/cotizaciones/preliminar', $this->payload())->assertOk()
            ->assertJsonPath('preliminar', true)->assertJsonPath('subtotal', '0.30')
            ->assertJsonPath('recargo_zona', '0.20')->assertJsonPath('total', '0.50');
    }

    public function test_tampered_amounts_invalid_ids_and_quantities_are_rejected(): void
    {
        $this->postJson('/api/cotizaciones/preliminar', $this->payload() + ['total' => 0])->assertUnprocessable();
        foreach ([0, -1, 1.5, 10001] as $cantidad) {
            $payload = $this->payload();
            $payload['items'][0]['cantidad'] = $cantidad;
            $this->postJson('/api/cotizaciones/preliminar', $payload)->assertUnprocessable();
        }
        $payload = $this->payload();
        $payload['items'][0]['precio_unitario'] = 0;
        $this->postJson('/api/cotizaciones/preliminar', $payload)->assertUnprocessable();
        $payload = $this->payload();
        $payload['items'][] = $payload['items'][0];
        $this->postJson('/api/cotizaciones/preliminar', $payload)->assertUnprocessable();
        $payload = $this->payload();
        $payload['items'][0]['id_tarifa'] = 999999;
        $this->postJson('/api/cotizaciones/preliminar', $payload)->assertUnprocessable();
        $this->postJson('/api/cotizaciones/preliminar', ['id_zona' => 99999, 'items' => []])->assertUnprocessable();
    }

    public function test_inactive_zone_tariff_or_category_cannot_be_quoted(): void
    {
        foreach ([$this->zona, $this->tarifa, $this->categoria] as $model) {
            $model->update(['activo' => false]);
            $this->postJson('/api/cotizaciones/preliminar', $this->payload())->assertUnprocessable();
            $model->update(['activo' => true]);
        }
    }

    public function test_multiple_items_and_overflow(): void
    {
        $second = TarifaItem::create(['id_categoria' => $this->categoria->getKey(), 'tipo_item' => 'Mueble', 'precio_unitario' => '10.25']);
        $payload = $this->payload();
        $payload['items'][] = ['id_tarifa' => $second->getKey(), 'cantidad' => 2];
        $this->postJson('/api/cotizaciones/preliminar', $payload)->assertOk()->assertJsonPath('total', '21.00');
        $this->tarifa->update(['precio_unitario' => '99999999.99']);
        $this->postJson('/api/cotizaciones/preliminar', $this->payload())->assertUnprocessable();
    }
}
