<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Reporte;
use App\Models\Rol;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\TablasDePedidos;
use Tests\TestCase;

class ReportesAdminApiTest extends TestCase
{
    use TablasDePedidos;

    private Usuario $admin;

    private Usuario $ana;

    private Usuario $luis;

    private Pedido $pedidoAna;

    protected function setUp(): void
    {
        parent::setUp();
        $this->armarTablasDePedidos();

        $zona = ZonaCobertura::create(['nombre' => 'San Salvador Centro']);
        $this->admin = $this->usuario('Administrador', 'admin@example.com', 'Admin');
        $this->ana = $this->usuario('Cliente', 'ana@example.com', 'Ana Martínez');
        $this->luis = $this->usuario('Cliente', 'luis@example.com', 'Luis Portillo');
        $this->pedidoAna = $this->pedido($this->ana, $zona);
    }

    private function usuario(string $rol, string $correo, string $nombre): Usuario
    {
        $modelo = Rol::firstOrCreate(['nombre_rol' => $rol]);

        return Usuario::create(['id_rol' => $modelo->getKey(), 'nombre' => $nombre, 'correo' => $correo, 'telefono' => '7000-0000']);
    }

    private function pedido(Usuario $dueño, ZonaCobertura $zona): Pedido
    {
        return Pedido::create([
            'id_usuario' => $dueño->getKey(), 'id_zona' => $zona->getKey(), 'direccion' => 'Colonia Escalón, casa 12',
            'fecha_servicio' => '2026-11-05', 'franja_horaria' => '8:00 a. m.', 'fecha_creacion' => now(), 'estado' => 'Finalizado',
            'subtotal' => '40.00', 'recargo_zona' => '0.00', 'total' => '40.00',
        ]);
    }

    private function reporte(Pedido $pedido, string $estado = 'Recibido', string $motivo = 'Otro'): Reporte
    {
        return Reporte::create(['id_pedido' => $pedido->getKey(), 'id_usuario' => $pedido->id_usuario, 'motivo' => $motivo, 'descripcion' => 'Descripción del problema', 'estado' => $estado]);
    }

    public function test_solo_el_administrador_entra(): void
    {
        $reporte = $this->reporte($this->pedidoAna);
        $this->getJson('/api/admin/reportes')->assertUnauthorized();

        Sanctum::actingAs($this->ana);
        $this->getJson('/api/admin/reportes')->assertForbidden();
        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'Resuelto', 'respuesta' => 'x'])->assertForbidden();
        $this->assertSame('Recibido', $reporte->refresh()->estado);
        $this->getJson('/api/admin/pendientes')->assertForbidden();
    }

    public function test_la_lista_trae_cliente_y_pedido_y_pone_primero_lo_abierto(): void
    {
        $resuelto = $this->reporte($this->pedidoAna, 'Resuelto');
        $abierto = $this->reporte($this->pedidoAna, 'Recibido', 'Llegaron tarde');
        $revision = $this->reporte($this->pedidoAna, 'En revisión');
        Sanctum::actingAs($this->admin);

        $r = $this->getJson('/api/admin/reportes')->assertOk()->assertJsonCount(3);
        $r->assertJsonPath('0.id_reporte', $abierto->getKey())
            ->assertJsonPath('1.id_reporte', $revision->getKey())
            ->assertJsonPath('2.id_reporte', $resuelto->getKey())
            ->assertJsonPath('0.usuario.nombre', 'Ana Martínez')
            ->assertJsonPath('0.usuario.telefono', '7000-0000')
            ->assertJsonPath('0.pedido.id_pedido', $this->pedidoAna->getKey())
            ->assertJsonPath('0.pedido.zona.nombre', 'San Salvador Centro');
    }

    public function test_filtra_por_estado_y_busca_por_cliente_reporte_o_pedido(): void
    {
        $zona = ZonaCobertura::first();
        $deLuis = $this->pedido($this->luis, $zona);
        $a = $this->reporte($this->pedidoAna, 'Recibido');
        $b = $this->reporte($deLuis, 'Resuelto');
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/reportes?estado=Resuelto')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_reporte', $b->getKey());
        $this->getJson('/api/admin/reportes?buscar=ana')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_reporte', $a->getKey());
        $this->getJson('/api/admin/reportes?buscar=luis@example')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_reporte', $b->getKey());
        $this->getJson('/api/admin/reportes?buscar=R-000'.$b->getKey())->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_reporte', $b->getKey());
        $this->getJson('/api/admin/reportes?buscar=%23'.$this->pedidoAna->getKey())->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_reporte', $a->getKey());
        $this->getJson('/api/admin/reportes?estado=Inventado')->assertStatus(422);
    }

    public function test_el_admin_cambia_el_estado_y_responde(): void
    {
        $reporte = $this->reporte($this->pedidoAna);
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'En revisión'])->assertOk()
            ->assertJsonPath('estado', 'En revisión')->assertJsonPath('respuesta', null);

        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'Resuelto', 'respuesta' => '  Volveremos a limpiar el baño sin costo.  '])->assertOk()
            ->assertJsonPath('estado', 'Resuelto')
            ->assertJsonPath('respuesta', 'Volveremos a limpiar el baño sin costo.')
            ->assertJsonPath('usuario.nombre', 'Ana Martínez');

        // El cliente ve la respuesta en la app.
        Sanctum::actingAs($this->ana);
        $this->getJson('/api/mis-reportes')->assertOk()->assertJsonPath('0.estado', 'Resuelto')->assertJsonPath('0.respuesta', 'Volveremos a limpiar el baño sin costo.');
    }

    public function test_un_reporte_resuelto_ya_no_se_edita(): void
    {
        $reporte = $this->reporte($this->pedidoAna, 'Resuelto');
        $reporte->update(['respuesta' => 'Listo, ya lo resolvimos.']);
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'En revisión'])->assertStatus(422)->assertJsonValidationErrors('estado');
        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['respuesta' => 'Otra respuesta'])->assertStatus(422);

        $reporte->refresh();
        $this->assertSame('Resuelto', $reporte->estado);
        $this->assertSame('Listo, ya lo resolvimos.', $reporte->respuesta);
    }

    public function test_no_se_puede_resolver_sin_respuesta_para_el_cliente(): void
    {
        $reporte = $this->reporte($this->pedidoAna);
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'Resuelto'])->assertStatus(422)->assertJsonValidationErrors('respuesta');
        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'Resuelto', 'respuesta' => '   '])->assertStatus(422)->assertJsonValidationErrors('respuesta');
        $this->assertSame('Recibido', $reporte->refresh()->estado);

        // Si ya tenía respuesta guardada, basta con cambiar el estado.
        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'En revisión', 'respuesta' => 'Estamos en eso.'])->assertOk();
        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'Resuelto'])->assertOk()->assertJsonPath('respuesta', 'Estamos en eso.');
    }

    public function test_valida_estado_y_largo_de_la_respuesta_y_no_deja_tocar_lo_demas(): void
    {
        $reporte = $this->reporte($this->pedidoAna);
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['estado' => 'Cerrado'])->assertStatus(422)->assertJsonValidationErrors('estado');
        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['respuesta' => str_repeat('a', 501)])->assertStatus(422)->assertJsonValidationErrors('respuesta');
        $this->patchJson("/api/admin/reportes/{$reporte->getKey()}", ['descripcion' => 'Cambiada', 'motivo' => 'Otro', 'id_usuario' => $this->luis->getKey()])->assertOk();

        $reporte->refresh();
        $this->assertSame('Descripción del problema', $reporte->descripcion);
        $this->assertSame($this->ana->getKey(), $reporte->id_usuario);
        $this->patchJson('/api/admin/reportes/9999', ['estado' => 'Resuelto', 'respuesta' => 'x'])->assertNotFound();
    }

    public function test_el_pedido_muestra_sus_reportes_en_el_panel_y_en_la_app(): void
    {
        $this->reporte($this->pedidoAna, 'En revisión', 'Cobro incorrecto');
        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/pedidos')->assertOk()
            ->assertJsonPath('0.reportes.0.motivo', 'Cobro incorrecto')->assertJsonPath('0.reportes.0.estado', 'En revisión')
            ->assertJsonPath('0.valoracion', null);
        $this->getJson("/api/admin/pedidos/{$this->pedidoAna->getKey()}")->assertOk()->assertJsonPath('reportes.0.estado', 'En revisión');

        Sanctum::actingAs($this->ana);
        $this->getJson('/api/mis-pedidos')->assertOk()->assertJsonPath('0.reportes.0.estado', 'En revisión');
    }

    public function test_pendientes_cuenta_solo_lo_que_espera_atencion(): void
    {
        $this->reporte($this->pedidoAna, 'Recibido');
        $this->reporte($this->pedidoAna, 'En revisión');
        $this->reporte($this->pedidoAna, 'Resuelto');
        Pedido::create([
            'id_usuario' => $this->ana->getKey(), 'id_zona' => ZonaCobertura::first()->getKey(), 'direccion' => 'Colonia Escalón, casa 12', 'fecha_servicio' => '2026-11-20',
            'franja_horaria' => '8:00 a. m.', 'fecha_creacion' => now(), 'estado' => 'Cotizado', 'subtotal' => '10.00', 'recargo_zona' => '0.00', 'total' => '10.00',
        ]);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/pendientes')->assertOk()->assertExactJson([
            'pedidos_por_confirmar' => 1, 'reportes_abiertos' => 2, 'valoraciones_pendientes' => 0,
        ]);
    }
}
