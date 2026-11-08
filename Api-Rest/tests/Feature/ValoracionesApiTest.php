<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Rol;
use App\Models\Usuario;
use App\Models\Valoracion;
use App\Models\ZonaCobertura;
use App\Support\ValoracionFormato;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\TablasDePedidos;
use Tests\TestCase;

class ValoracionesApiTest extends TestCase
{
    use TablasDePedidos;

    private Usuario $admin;

    private Usuario $ana;

    private Usuario $luis;

    private ZonaCobertura $zona;

    protected function setUp(): void
    {
        parent::setUp();
        $this->armarTablasDePedidos();

        $this->zona = ZonaCobertura::create(['nombre' => 'San Salvador Centro']);
        $this->admin = $this->usuario('Administrador', 'admin@example.com', 'Admin');
        $this->ana = $this->usuario('Cliente', 'ana@example.com', 'Ana Martínez');
        $this->luis = $this->usuario('Cliente', 'luis@example.com', 'Luis Portillo');
    }

    private function usuario(string $rol, string $correo, string $nombre): Usuario
    {
        $modelo = Rol::firstOrCreate(['nombre_rol' => $rol]);

        return Usuario::create(['id_rol' => $modelo->getKey(), 'nombre' => $nombre, 'correo' => $correo]);
    }

    private function pedido(Usuario $dueño, string $estado = 'Finalizado'): Pedido
    {
        return Pedido::create([
            'id_usuario' => $dueño->getKey(), 'id_zona' => $this->zona->getKey(), 'direccion' => 'Colonia Escalón, casa 12',
            'fecha_servicio' => '2026-11-05', 'franja_horaria' => '8:00 a. m.', 'fecha_creacion' => now(), 'estado' => $estado,
            'subtotal' => '40.00', 'recargo_zona' => '0.00', 'total' => '40.00',
        ]);
    }

    private function payload(Pedido $pedido, array $cambios = []): array
    {
        return array_merge(['id_pedido' => $pedido->getKey(), 'estrellas' => 5, 'aspectos' => ['Puntualidad', 'Limpieza'], 'comentario' => 'Quedó como nuevo.'], $cambios);
    }

    private function valoracion(Pedido $pedido, string $estado = 'Pendiente', int $estrellas = 4): Valoracion
    {
        return Valoracion::create(['id_pedido' => $pedido->getKey(), 'id_usuario' => $pedido->id_usuario, 'estrellas' => $estrellas, 'aspectos' => ['Limpieza'], 'comentario' => 'Bien', 'estado' => $estado]);
    }

    // ----- Cliente -----

    public function test_hay_que_iniciar_sesion(): void
    {
        $this->postJson('/api/valoraciones', [])->assertUnauthorized();
        $this->getJson('/api/mis-valoraciones')->assertUnauthorized();
    }

    public function test_cliente_valora_un_pedido_finalizado_y_queda_pendiente_de_aprobar(): void
    {
        $pedido = $this->pedido($this->ana);
        Sanctum::actingAs($this->ana);

        $this->postJson('/api/valoraciones', $this->payload($pedido))->assertCreated()
            ->assertJsonPath('estrellas', 5)->assertJsonPath('estado', 'Pendiente')
            ->assertJsonPath('aspectos', ['Puntualidad', 'Limpieza'])->assertJsonPath('comentario', 'Quedó como nuevo.');

        $this->assertDatabaseHas('valoraciones', ['id_pedido' => $pedido->getKey(), 'id_usuario' => $this->ana->getKey(), 'estado' => 'Pendiente']);
        $this->getJson('/api/mis-pedidos')->assertOk()->assertJsonPath('0.valoracion.estrellas', 5)->assertJsonPath('0.valoracion.estado', 'Pendiente');
    }

    public function test_aspectos_y_comentario_son_opcionales(): void
    {
        $pedido = $this->pedido($this->ana);
        Sanctum::actingAs($this->ana);

        $this->postJson('/api/valoraciones', ['id_pedido' => $pedido->getKey(), 'estrellas' => 3, 'comentario' => '   '])->assertCreated()
            ->assertJsonPath('aspectos', [])->assertJsonPath('comentario', null);
    }

    public function test_solo_un_pedido_finalizado_y_propio_y_una_sola_vez(): void
    {
        $enCurso = $this->pedido($this->ana, 'En proceso');
        $ajeno = $this->pedido($this->luis);
        $suyo = $this->pedido($this->ana);
        Sanctum::actingAs($this->ana);

        $this->postJson('/api/valoraciones', $this->payload($enCurso))->assertStatus(422)->assertJsonPath('message', 'Solo puedes valorar un pedido finalizado.');
        $this->postJson('/api/valoraciones', $this->payload($ajeno))->assertNotFound();
        $this->postJson('/api/valoraciones', $this->payload($suyo, ['id_pedido' => 9999]))->assertNotFound();

        $this->postJson('/api/valoraciones', $this->payload($suyo))->assertCreated();
        $this->postJson('/api/valoraciones', $this->payload($suyo))->assertStatus(422)->assertJsonPath('message', 'Ya valoraste este pedido.');
        $this->assertDatabaseCount('valoraciones', 1);
    }

    public function test_valida_estrellas_aspectos_y_comentario(): void
    {
        $pedido = $this->pedido($this->ana);
        Sanctum::actingAs($this->ana);

        foreach ([0, 6, 'a', null] as $malo) {
            $this->postJson('/api/valoraciones', $this->payload($pedido, ['estrellas' => $malo]))->assertStatus(422)->assertJsonValidationErrors('estrellas');
        }
        $this->postJson('/api/valoraciones', $this->payload($pedido, ['aspectos' => ['Rapidez']]))->assertStatus(422)->assertJsonValidationErrors('aspectos.0');
        $this->postJson('/api/valoraciones', $this->payload($pedido, ['aspectos' => ['Limpieza', 'Limpieza']]))->assertStatus(422);
        $this->postJson('/api/valoraciones', $this->payload($pedido, ['comentario' => str_repeat('a', 501)]))->assertStatus(422)->assertJsonValidationErrors('comentario');
        $this->assertDatabaseCount('valoraciones', 0);
    }

    public function test_el_cliente_no_fija_estado_ni_usuario(): void
    {
        $pedido = $this->pedido($this->ana);
        Sanctum::actingAs($this->ana);

        $this->postJson('/api/valoraciones', $this->payload($pedido, ['estado' => 'Publicada']))->assertStatus(422)->assertJsonValidationErrors('estado');
        $this->postJson('/api/valoraciones', $this->payload($pedido, ['id_usuario' => $this->luis->getKey()]))->assertStatus(422)->assertJsonValidationErrors('id_usuario');
    }

    public function test_mis_valoraciones_solo_trae_las_propias(): void
    {
        $this->valoracion($this->pedido($this->luis));
        $mia = $this->valoracion($this->pedido($this->ana), 'Publicada');
        Sanctum::actingAs($this->ana);

        $this->getJson('/api/mis-valoraciones')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_valoracion', $mia->getKey())->assertJsonPath('0.estado', 'Publicada');
    }

    public function test_al_eliminar_la_cuenta_se_borra_el_comentario_pero_queda_la_calificacion(): void
    {
        $pedido = $this->pedido($this->ana);
        $this->valoracion($pedido);
        $this->ana->forceFill(['password_hash' => bcrypt('Clave-Segura-123')])->save();
        Sanctum::actingAs($this->ana);

        $this->deleteJson('/api/me', ['password' => 'Clave-Segura-123'])->assertNoContent();
        $this->assertDatabaseHas('valoraciones', ['id_pedido' => $pedido->getKey(), 'estrellas' => 4, 'comentario' => null]);
    }

    // ----- Administrador -----

    public function test_solo_el_administrador_modera(): void
    {
        $v = $this->valoracion($this->pedido($this->ana));
        $this->getJson('/api/admin/valoraciones')->assertUnauthorized();

        Sanctum::actingAs($this->ana);
        $this->getJson('/api/admin/valoraciones')->assertForbidden();
        $this->patchJson("/api/admin/valoraciones/{$v->getKey()}", ['estado' => 'Publicada'])->assertForbidden();
        $this->deleteJson("/api/admin/valoraciones/{$v->getKey()}")->assertForbidden();
        $this->assertSame('Pendiente', $v->refresh()->estado);
    }

    public function test_la_lista_pone_primero_las_pendientes_y_trae_cliente_y_servicio(): void
    {
        $publicada = $this->valoracion($this->pedido($this->ana), 'Publicada');
        $oculta = $this->valoracion($this->pedido($this->luis), 'Oculta');
        $pendiente = $this->valoracion($this->pedido($this->ana), 'Pendiente');
        Sanctum::actingAs($this->admin);

        $r = $this->getJson('/api/admin/valoraciones')->assertOk()->assertJsonCount(3);
        $r->assertJsonPath('0.id_valoracion', $pendiente->getKey())
            ->assertJsonPath('1.id_valoracion', $publicada->getKey())
            ->assertJsonPath('2.id_valoracion', $oculta->getKey())
            ->assertJsonPath('0.usuario.nombre', 'Ana Martínez')
            ->assertJsonPath('0.pedido.zona.nombre', 'San Salvador Centro');

        $this->getJson('/api/admin/valoraciones?estado=Oculta')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id_valoracion', $oculta->getKey());
        $this->getJson('/api/admin/valoraciones?estado=Otra')->assertStatus(422);
    }

    public function test_el_admin_publica_oculta_y_elimina(): void
    {
        $v = $this->valoracion($this->pedido($this->ana));
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/admin/valoraciones/{$v->getKey()}", ['estado' => 'Publicada'])->assertOk()->assertJsonPath('estado', 'Publicada')->assertJsonPath('usuario.nombre', 'Ana Martínez');
        $this->patchJson("/api/admin/valoraciones/{$v->getKey()}", ['estado' => 'Oculta'])->assertOk()->assertJsonPath('estado', 'Oculta');
        $this->patchJson("/api/admin/valoraciones/{$v->getKey()}", ['estado' => 'Cualquiera'])->assertStatus(422);
        $this->patchJson("/api/admin/valoraciones/{$v->getKey()}", ['estado' => 'Publicada', 'estrellas' => 1, 'comentario' => 'Editado'])->assertOk();
        $this->assertSame(4, $v->refresh()->estrellas);
        $this->assertSame('Bien', $v->comentario);

        $this->deleteJson("/api/admin/valoraciones/{$v->getKey()}")->assertNoContent();
        $this->assertDatabaseCount('valoraciones', 0);
        $this->patchJson('/api/admin/valoraciones/9999', ['estado' => 'Publicada'])->assertNotFound();
    }

    public function test_pendientes_cuenta_las_valoraciones_por_aprobar(): void
    {
        $this->valoracion($this->pedido($this->ana), 'Pendiente');
        $this->valoracion($this->pedido($this->luis), 'Publicada');
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/pendientes')->assertOk()->assertJsonPath('valoraciones_pendientes', 1);
        $this->getJson('/api/admin/pedidos')->assertOk()->assertJsonCount(2);
    }

    public function test_la_app_muestra_solo_las_publicadas_sin_datos_de_contacto(): void
    {
        $publicada = $this->valoracion($this->pedido($this->ana), 'Publicada', 5);
        $this->valoracion($this->pedido($this->luis), 'Oculta', 1);
        $this->valoracion($this->pedido($this->luis), 'Pendiente', 3);

        // Es pública: no hace falta iniciar sesión.
        $r = $this->getJson('/api/valoraciones-publicas')->assertOk()->assertJsonCount(1);
        $r->assertJsonPath('0.id_valoracion', $publicada->getKey())
            ->assertJsonPath('0.estrellas', 5)
            ->assertJsonPath('0.nombre', 'Ana M.')
            ->assertJsonPath('0.comentario', 'Bien');
        $this->assertEqualsCanonicalizing(['id_valoracion', 'estrellas', 'aspectos', 'comentario', 'nombre', 'fecha'], array_keys($r->json('0')));
        $this->assertStringNotContainsString('ana@example.com', $r->getContent());
    }

    public function test_sin_publicadas_la_lista_viene_vacia(): void
    {
        $this->valoracion($this->pedido($this->ana), 'Pendiente');

        $this->getJson('/api/valoraciones-publicas')->assertOk()->assertExactJson([]);
    }

    public function test_el_nombre_se_abrevia_para_no_exponer_al_cliente(): void
    {
        $this->assertSame('Ana M.', ValoracionFormato::nombreAbreviado('Ana Martínez'));
        $this->assertSame('Ana M.', ValoracionFormato::nombreAbreviado('  ana   maría Martínez López '));
        $this->assertSame('Luis', ValoracionFormato::nombreAbreviado('Luis'));
        $this->assertSame('Cliente', ValoracionFormato::nombreAbreviado(null));
        $this->assertSame('Cliente', ValoracionFormato::nombreAbreviado('   '));
        $this->assertSame('Álvaro Ñ.', ValoracionFormato::nombreAbreviado('Álvaro ñandú'));
    }

    public function test_la_app_nunca_muestra_mas_del_maximo_y_ocultar_una_la_quita(): void
    {
        $ids = [];
        for ($i = 0; $i < Valoracion::MAXIMO_EN_APP + 2; $i++) {
            $ids[] = $this->valoracion($this->pedido($this->ana), 'Publicada')->getKey(); // datos viejos: más de lo permitido
        }
        $this->getJson('/api/valoraciones-publicas')->assertOk()->assertJsonCount(Valoracion::MAXIMO_EN_APP);

        Sanctum::actingAs($this->admin);
        $this->patchJson('/api/admin/valoraciones/'.$ids[0], ['estado' => 'Oculta'])->assertOk();
        $this->assertNotContains($ids[0], array_column($this->getJson('/api/valoraciones-publicas')->json(), 'id_valoracion'));
    }

    public function test_el_panel_no_deja_mostrar_mas_del_maximo(): void
    {
        for ($i = 0; $i < Valoracion::MAXIMO_EN_APP; $i++) {
            $this->valoracion($this->pedido($this->ana), 'Publicada');
        }
        $pendiente = $this->valoracion($this->pedido($this->luis), 'Pendiente');
        $oculta = $this->valoracion($this->pedido($this->luis), 'Oculta');
        Sanctum::actingAs($this->admin);

        $this->patchJson('/api/admin/valoraciones/'.$pendiente->getKey(), ['estado' => 'Publicada'])
            ->assertStatus(422)->assertJsonValidationErrors('estado');
        $this->patchJson('/api/admin/valoraciones/'.$oculta->getKey(), ['estado' => 'Publicada'])->assertStatus(422);
        $this->assertSame('Pendiente', $pendiente->refresh()->estado);

        // Ocultar y eliminar siguen funcionando, y al liberar un lugar ya se puede mostrar otra.
        $primera = Valoracion::where('estado', 'Publicada')->first();
        $this->patchJson('/api/admin/valoraciones/'.$primera->getKey(), ['estado' => 'Oculta'])->assertOk();
        $this->patchJson('/api/admin/valoraciones/'.$pendiente->getKey(), ['estado' => 'Publicada'])->assertOk();
        $this->assertSame(Valoracion::MAXIMO_EN_APP, Valoracion::where('estado', 'Publicada')->count());
    }
}
