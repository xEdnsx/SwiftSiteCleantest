<?php

namespace Tests\Feature;

use App\Models\CategoriaServicio;
use App\Models\Pedido;
use App\Models\Reporte;
use App\Models\Rol;
use App\Models\TarifaItem;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\TablasDePedidos;
use Tests\TestCase;

class ReportesApiTest extends TestCase
{
    use TablasDePedidos;

    private Usuario $cliente;

    private Usuario $otro;

    private ZonaCobertura $zona;

    protected function setUp(): void
    {
        parent::setUp();

        $this->armarTablasDePedidos();

        $categoria = CategoriaServicio::create(['nombre' => 'Muebles']);
        TarifaItem::create(['id_categoria' => $categoria->getKey(), 'tipo_item' => 'Sofá', 'material' => 'Tela', 'precio_unitario' => '40.00']);
        $this->zona = ZonaCobertura::create(['nombre' => 'San Salvador Centro', 'recargo' => '0.00']);

        $rol = Rol::firstOrCreate(['nombre_rol' => 'Cliente']);
        $this->cliente = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Ana', 'correo' => 'ana@example.com', 'telefono' => '7000-0000']);
        $this->otro = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Luis', 'correo' => 'luis@example.com', 'telefono' => '7111-1111']);
    }

    private function pedido(Usuario $dueño, string $estado = 'Finalizado'): Pedido
    {
        return Pedido::create([
            'id_usuario' => $dueño->getKey(), 'id_zona' => $this->zona->getKey(),
            'direccion' => 'Colonia Escalón, calle 3, casa 12', 'fecha_servicio' => now()->toDateString(),
            'franja_horaria' => '8:00 a. m. - 10:00 a. m.', 'fecha_creacion' => now(), 'estado' => $estado,
            'subtotal' => '40.00', 'recargo_zona' => '0.00', 'total' => '40.00',
        ]);
    }

    private function payload(Pedido $pedido, array $cambios = []): array
    {
        return array_merge([
            'id_pedido' => $pedido->getKey(),
            'motivo' => 'Limpieza incompleta',
            'descripcion' => 'Quedó sarro en la regadera y el piso no se limpió.',
        ], $cambios);
    }

    public function test_hay_que_iniciar_sesion(): void
    {
        $this->postJson('/api/reportes', [])->assertUnauthorized();
        $this->getJson('/api/mis-reportes')->assertUnauthorized();
    }

    public function test_cliente_reporta_un_pedido_finalizado_suyo(): void
    {
        $pedido = $this->pedido($this->cliente);
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/reportes', $this->payload($pedido))->assertCreated()
            ->assertJsonPath('id_pedido', $pedido->getKey())
            ->assertJsonPath('motivo', 'Limpieza incompleta')
            ->assertJsonPath('estado', 'Recibido')
            ->assertJsonPath('respuesta', null);

        $this->assertDatabaseHas('reportes', ['id_pedido' => $pedido->getKey(), 'id_usuario' => $this->cliente->getKey(), 'estado' => 'Recibido']);
    }

    public function test_no_se_puede_reportar_un_pedido_que_no_esta_finalizado(): void
    {
        $pedido = $this->pedido($this->cliente, 'En proceso');
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/reportes', $this->payload($pedido))->assertStatus(422)
            ->assertJsonPath('message', 'Solo puedes reportar un problema de un pedido finalizado.');
        $this->assertDatabaseCount('reportes', 0);
    }

    public function test_un_pedido_ajeno_o_inexistente_responde_404(): void
    {
        $ajeno = $this->pedido($this->otro);
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/reportes', $this->payload($ajeno))->assertNotFound();
        $this->postJson('/api/reportes', $this->payload($ajeno, ['id_pedido' => 9999]))->assertNotFound();
        $this->assertDatabaseCount('reportes', 0);
    }

    public function test_valida_motivo_y_descripcion(): void
    {
        $pedido = $this->pedido($this->cliente);
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/reportes', $this->payload($pedido, ['motivo' => 'Me cayó mal']))->assertStatus(422)->assertJsonValidationErrors('motivo');
        $this->postJson('/api/reportes', $this->payload($pedido, ['descripcion' => 'corto']))->assertStatus(422)->assertJsonValidationErrors('descripcion');
        $this->postJson('/api/reportes', $this->payload($pedido, ['descripcion' => str_repeat('a', 501)]))->assertStatus(422)->assertJsonValidationErrors('descripcion');
        $this->assertDatabaseCount('reportes', 0);
    }

    public function test_no_acepta_que_el_cliente_fije_estado_usuario_ni_respuesta(): void
    {
        $pedido = $this->pedido($this->cliente);
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/reportes', $this->payload($pedido, ['estado' => 'Resuelto']))->assertStatus(422)->assertJsonValidationErrors('estado');
        $this->postJson('/api/reportes', $this->payload($pedido, ['id_usuario' => $this->otro->getKey()]))->assertStatus(422)->assertJsonValidationErrors('id_usuario');
        $this->postJson('/api/reportes', $this->payload($pedido, ['respuesta' => 'Ya está resuelto']))->assertStatus(422)->assertJsonValidationErrors('respuesta');
    }

    public function test_no_se_duplica_un_reporte_abierto_pero_se_puede_volver_a_reportar_si_ya_se_resolvio(): void
    {
        $pedido = $this->pedido($this->cliente);
        Sanctum::actingAs($this->cliente);

        $id = $this->postJson('/api/reportes', $this->payload($pedido))->assertCreated()->json('id_reporte');
        $this->postJson('/api/reportes', $this->payload($pedido))->assertStatus(422)
            ->assertJsonPath('message', 'Ya enviaste un reporte de este pedido y lo estamos revisando.');

        Reporte::whereKey($id)->update(['estado' => 'Resuelto']);
        $this->postJson('/api/reportes', $this->payload($pedido, ['motivo' => 'Otro']))->assertCreated();
        $this->assertDatabaseCount('reportes', 2);
    }

    public function test_mis_reportes_solo_trae_los_de_la_persona_y_el_mas_reciente_primero(): void
    {
        $mio = $this->pedido($this->cliente);
        $ajeno = $this->pedido($this->otro);
        Reporte::create(['id_pedido' => $ajeno->getKey(), 'id_usuario' => $this->otro->getKey(), 'motivo' => 'Otro', 'descripcion' => 'Reporte de otra persona', 'estado' => 'Recibido']);
        $primero = Reporte::create(['id_pedido' => $mio->getKey(), 'id_usuario' => $this->cliente->getKey(), 'motivo' => 'Llegaron tarde', 'descripcion' => 'Llegaron una hora tarde', 'estado' => 'Resuelto', 'respuesta' => 'Te pedimos disculpas.']);
        Sanctum::actingAs($this->cliente);

        $respuesta = $this->getJson('/api/mis-reportes')->assertOk()->assertJsonCount(1);
        $respuesta->assertJsonPath('0.id_reporte', $primero->getKey())
            ->assertJsonPath('0.estado', 'Resuelto')
            ->assertJsonPath('0.respuesta', 'Te pedimos disculpas.');
    }

    public function test_al_eliminar_la_cuenta_el_texto_del_reporte_se_borra_pero_el_registro_queda(): void
    {
        $pedido = $this->pedido($this->cliente);
        Reporte::create(['id_pedido' => $pedido->getKey(), 'id_usuario' => $this->cliente->getKey(), 'motivo' => 'Otro', 'descripcion' => 'Mi vecina Marta Pérez lo vio todo', 'estado' => 'Recibido']);
        $this->cliente->forceFill(['password_hash' => bcrypt('Clave-Segura-123')])->save();
        Sanctum::actingAs($this->cliente);

        $this->deleteJson('/api/me', ['password' => 'Clave-Segura-123'])->assertNoContent();

        $this->assertDatabaseHas('reportes', ['id_usuario' => $this->cliente->getKey(), 'descripcion' => 'Texto eliminado por el titular']);
    }
}
