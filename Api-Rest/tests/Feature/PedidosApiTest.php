<?php

namespace Tests\Feature;

use App\Models\CategoriaServicio;
use App\Models\Pedido;
use App\Models\Rol;
use App\Models\TarifaItem;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\TablasDePedidos;
use Tests\TestCase;

class PedidosApiTest extends TestCase
{
    use TablasDePedidos;

    private TarifaItem $tarifa;

    private ZonaCobertura $zona;

    private Usuario $cliente;

    private Usuario $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->armarTablasDePedidos();

        $categoria = CategoriaServicio::create(['nombre' => 'Muebles']);
        $this->tarifa = TarifaItem::create(['id_categoria' => $categoria->getKey(), 'tipo_item' => 'Sofá 2 plazas', 'material' => 'Cuero', 'precio_unitario' => '45.50']);
        $this->zona = ZonaCobertura::create(['nombre' => 'San Salvador Centro', 'recargo' => '3.00']);

        $this->cliente = $this->usuario('Cliente', 'cliente@example.com', 'Ana Cliente');
        $this->admin = $this->usuario('Administrador', 'admin@example.com', 'Admin Prueba');
    }

    private function usuario(string $rol, string $correo, string $nombre): Usuario
    {
        $modelo = Rol::firstOrCreate(['nombre_rol' => $rol]);

        return Usuario::create(['id_rol' => $modelo->getKey(), 'nombre' => $nombre, 'correo' => $correo, 'telefono' => '7000-0000']);
    }

    private function payload(array $cambios = []): array
    {
        return array_merge([
            'id_zona' => $this->zona->getKey(),
            'direccion' => 'Colonia Escalón, calle 3, casa 12, frente al parque',
            'fecha_servicio' => now()->addDay()->toDateString(),
            'franja_horaria' => '8:00 a. m. - 10:00 a. m.',
            'items' => [['id_tarifa' => $this->tarifa->getKey(), 'cantidad' => 2]],
        ], $cambios);
    }

    private function crearPedido(?Usuario $dueño = null): int
    {
        Sanctum::actingAs($dueño ?? $this->cliente);

        return $this->postJson('/api/pedidos', $this->payload())->assertCreated()->json('id_pedido');
    }

    public function test_cliente_crea_pedido_con_montos_calculados_en_el_servidor(): void
    {
        Sanctum::actingAs($this->cliente);

        $respuesta = $this->postJson('/api/pedidos', $this->payload())->assertCreated()
            ->assertJsonPath('estado', 'Cotizado')
            ->assertJsonPath('subtotal', '91.00')
            ->assertJsonPath('recargo_zona', '3.00')
            ->assertJsonPath('total', '94.00')
            ->assertJsonPath('zona.nombre', 'San Salvador Centro')
            ->assertJsonPath('lineas.0.tipo_item', 'Sofá 2 plazas')
            ->assertJsonPath('lineas.0.material', 'Cuero')
            ->assertJsonPath('lineas.0.cantidad', 2)
            ->assertJsonPath('lineas.0.subtotal', '91.00');

        $this->assertDatabaseHas('pedidos', ['id_pedido' => $respuesta->json('id_pedido'), 'id_usuario' => $this->cliente->getKey(), 'total' => '94.00']);
        $this->assertDatabaseCount('detalle_pedidos', 1);
    }

    public function test_el_precio_guardado_no_cambia_si_el_catalogo_cambia_despues(): void
    {
        $id = $this->crearPedido();
        $this->tarifa->update(['precio_unitario' => '99.00']);

        Sanctum::actingAs($this->cliente);
        $this->getJson("/api/mis-pedidos/$id")->assertOk()
            ->assertJsonPath('total', '94.00')
            ->assertJsonPath('lineas.0.precio_unitario', '45.50');
    }

    public function test_sin_sesion_no_se_puede_pedir_ni_ver_pedidos(): void
    {
        $this->postJson('/api/pedidos', $this->payload())->assertUnauthorized();
        $this->getJson('/api/mis-pedidos')->assertUnauthorized();
        $this->getJson('/api/admin/pedidos')->assertUnauthorized();
    }

    public function test_datos_manipulados_o_invalidos_se_rechazan(): void
    {
        Sanctum::actingAs($this->cliente);

        foreach ([['total' => 1], ['subtotal' => 1], ['recargo_zona' => 0], ['estado' => 'Finalizado'], ['id_usuario' => $this->admin->getKey()]] as $extra) {
            $this->postJson('/api/pedidos', $this->payload($extra))->assertUnprocessable();
        }
        $this->postJson('/api/pedidos', $this->payload(['direccion' => 'corta']))->assertUnprocessable()->assertJsonValidationErrors('direccion');
        $this->postJson('/api/pedidos', $this->payload(['fecha_servicio' => now()->subDay()->toDateString()]))->assertUnprocessable()->assertJsonValidationErrors('fecha_servicio');
        $this->postJson('/api/pedidos', $this->payload(['fecha_servicio' => 'mañana']))->assertUnprocessable()->assertJsonValidationErrors('fecha_servicio');
        $this->postJson('/api/pedidos', $this->payload(['franja_horaria' => '']))->assertUnprocessable()->assertJsonValidationErrors('franja_horaria');
        $this->postJson('/api/pedidos', $this->payload(['items' => []]))->assertUnprocessable();
        $this->postJson('/api/pedidos', $this->payload(['items' => [['id_tarifa' => $this->tarifa->getKey(), 'cantidad' => 0]]]))->assertUnprocessable();
        $this->postJson('/api/pedidos', $this->payload(['items' => [['id_tarifa' => $this->tarifa->getKey(), 'cantidad' => 1, 'precio_unitario' => 0]]]))->assertUnprocessable();
        $this->postJson('/api/pedidos', $this->payload(['items' => [['id_tarifa' => 99999, 'cantidad' => 1]]]))->assertUnprocessable();

        $this->assertDatabaseCount('pedidos', 0);
    }

    public function test_zona_o_tarifa_inactiva_no_se_puede_pedir_y_no_deja_pedidos_a_medias(): void
    {
        Sanctum::actingAs($this->cliente);

        foreach ([$this->zona, $this->tarifa] as $modelo) {
            $modelo->update(['activo' => false]);
            $this->postJson('/api/pedidos', $this->payload())->assertUnprocessable();
            $modelo->update(['activo' => true]);
        }
        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount('detalle_pedidos', 0);
    }

    public function test_cada_cliente_solo_ve_sus_pedidos(): void
    {
        $otro = $this->usuario('Cliente', 'otro@example.com', 'Otro Cliente');
        $mio = $this->crearPedido();
        $ajeno = $this->crearPedido($otro);

        Sanctum::actingAs($this->cliente);
        $this->getJson('/api/mis-pedidos')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_pedido', $mio);
        $this->getJson("/api/mis-pedidos/$mio")->assertOk();
        $this->getJson("/api/mis-pedidos/$ajeno")->assertNotFound();
    }

    public function test_el_administrador_lista_filtra_y_ve_el_detalle(): void
    {
        $primero = $this->crearPedido();
        $segundo = $this->crearPedido($this->usuario('Cliente', 'bea@example.com', 'Beatriz Mejía'));
        Pedido::whereKey($segundo)->update(['estado' => 'Confirmado']);

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/pedidos')->assertOk()->assertJsonCount(2)
            ->assertJsonPath('0.usuario.nombre', 'Beatriz Mejía')
            ->assertJsonPath('0.usuario.correo', 'bea@example.com');
        $this->getJson('/api/admin/pedidos?estado=Confirmado')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_pedido', $segundo);
        $this->getJson('/api/admin/pedidos?buscar=Beatriz')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_pedido', $segundo);
        $this->getJson("/api/admin/pedidos?buscar=%23$primero")->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_pedido', $primero);
        $this->getJson('/api/admin/pedidos?estado=Inventado')->assertUnprocessable();
        $this->getJson("/api/admin/pedidos/$primero")->assertOk()
            ->assertJsonPath('usuario.nombre', 'Ana Cliente')
            ->assertJsonPath('lineas.0.tipo_item', 'Sofá 2 plazas');
        $this->getJson('/api/admin/pedidos/99999')->assertNotFound();
    }

    public function test_un_cliente_no_puede_usar_el_panel_administrativo(): void
    {
        $id = $this->crearPedido();

        Sanctum::actingAs($this->cliente);
        $this->getJson('/api/admin/pedidos')->assertForbidden();
        $this->getJson("/api/admin/pedidos/$id")->assertForbidden();
        $this->patchJson("/api/admin/pedidos/$id/estado", ['estado' => 'Confirmado'])->assertForbidden();
        $this->assertDatabaseHas('pedidos', ['id_pedido' => $id, 'estado' => 'Cotizado']);
    }

    public function test_el_estado_cambia_un_paso_a_la_vez(): void
    {
        $id = $this->crearPedido();
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/admin/pedidos/$id/estado", ['estado' => 'Confirmado'])->assertOk()->assertJsonPath('estado', 'Confirmado');
        $this->patchJson("/api/admin/pedidos/$id/estado", ['estado' => 'Finalizado'])->assertUnprocessable()->assertJsonValidationErrors('estado');
        $this->patchJson("/api/admin/pedidos/$id/estado", ['estado' => 'Confirmado'])->assertUnprocessable();
        $this->patchJson("/api/admin/pedidos/$id/estado", ['estado' => 'Inventado'])->assertUnprocessable();
        $this->patchJson("/api/admin/pedidos/$id/estado", [])->assertUnprocessable();
        $this->patchJson("/api/admin/pedidos/$id/estado", ['estado' => 'En proceso'])->assertOk();
        $this->patchJson("/api/admin/pedidos/$id/estado", ['estado' => 'Confirmado'])->assertOk()->assertJsonPath('estado', 'Confirmado');
        $this->assertDatabaseHas('pedidos', ['id_pedido' => $id, 'estado' => 'Confirmado']);
    }
}
