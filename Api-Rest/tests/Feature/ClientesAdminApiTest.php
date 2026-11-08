<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Rol;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\TablasDePedidos;
use Tests\TestCase;

class ClientesAdminApiTest extends TestCase
{
    use TablasDePedidos;

    private Usuario $admin;

    private ZonaCobertura $zona;

    protected function setUp(): void
    {
        parent::setUp();
        $this->armarTablasDePedidos();

        $this->zona = ZonaCobertura::create(['nombre' => 'Centro']);
        $this->admin = $this->usuario('Administrador', 'Admin', 'admin@example.com');
    }

    private function usuario(string $rol, string $nombre, string $correo, ?string $telefono = null): Usuario
    {
        $modelo = Rol::firstOrCreate(['nombre_rol' => $rol]);

        return Usuario::create([
            'id_rol' => $modelo->getKey(), 'nombre' => $nombre, 'correo' => $correo, 'telefono' => $telefono,
        ]);
    }

    private function pedido(Usuario $cliente, string $estado, string $total): Pedido
    {
        return Pedido::create([
            'id_usuario' => $cliente->getKey(), 'id_zona' => $this->zona->getKey(),
            'direccion' => 'Colonia Escalón, casa 12', 'fecha_servicio' => '2026-11-10',
            'franja_horaria' => '10:00', 'estado' => $estado,
            'subtotal' => $total, 'recargo_zona' => 0, 'total' => $total,
        ]);
    }

    public function test_only_administrators_can_use_the_client_endpoints(): void
    {
        $cliente = $this->usuario('Cliente', 'Ana', 'ana@example.com');
        $this->getJson('/api/admin/clientes')->assertUnauthorized();

        Sanctum::actingAs($cliente);
        $this->getJson('/api/admin/clientes')->assertForbidden();
        $this->postJson('/api/admin/clientes', ['nombre' => 'X Y', 'correo' => 'x@example.com'])->assertForbidden();
        $this->deleteJson('/api/admin/clientes/'.$cliente->getKey())->assertForbidden();
    }

    public function test_list_returns_only_clients_with_metrics_and_search(): void
    {
        $ana = $this->usuario('Cliente', 'Ana Pérez', 'ana@example.com', '7000-1111');
        $this->usuario('Cliente', 'Luis Gómez', 'luis@example.com');
        $this->pedido($ana, 'Finalizado', '40.00');
        $this->pedido($ana, 'Finalizado', '25.50');
        $this->pedido($ana, 'Cotizado', '99.00');

        Sanctum::actingAs($this->admin);
        $lista = $this->getJson('/api/admin/clientes')->assertOk()->assertJsonCount(2)
            ->assertJsonMissingPath('0.password_hash')->json();
        $this->assertNotContains('admin@example.com', array_column($lista, 'correo'));

        $fila = collect($lista)->firstWhere('correo', 'ana@example.com');
        $this->assertSame(3, $fila['pedidos_count']);
        $this->assertSame(2, $fila['servicios_finalizados']);
        $this->assertSame('65.50', $fila['total_gastado']);
        $this->assertNotNull($fila['ultimo_pedido']);

        $sin = collect($lista)->firstWhere('correo', 'luis@example.com');
        $this->assertSame(0, $sin['pedidos_count']);
        $this->assertSame('0.00', $sin['total_gastado']);
        $this->assertNull($sin['ultimo_pedido']);

        $this->getJson('/api/admin/clientes?buscar=7000')->assertOk()->assertJsonCount(1)->assertJsonPath('0.nombre', 'Ana Pérez');
        $this->getJson('/api/admin/clientes?buscar=luis@')->assertOk()->assertJsonCount(1);
        $this->getJson('/api/admin/clientes?buscar=nadie')->assertOk()->assertJsonCount(0);
    }

    public function test_profile_includes_order_history_and_hides_non_clients(): void
    {
        $ana = $this->usuario('Cliente', 'Ana Pérez', 'ana@example.com');
        $this->pedido($ana, 'Finalizado', '40.00');
        $this->pedido($ana, 'Confirmado', '30.00');

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/clientes/'.$ana->getKey())->assertOk()
            ->assertJsonPath('nombre', 'Ana Pérez')
            ->assertJsonPath('total_gastado', '40.00')
            ->assertJsonCount(2, 'pedidos')
            ->assertJsonPath('pedidos.0.zona.nombre', 'Centro');

        $this->getJson('/api/admin/clientes/'.$this->admin->getKey())->assertNotFound();
        $this->getJson('/api/admin/clientes/9999')->assertNotFound();
    }

    public function test_admin_creates_a_client_without_password_and_with_client_role(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/admin/clientes', [
            'nombre' => 'María López', 'telefono' => '+503 7000-2222', 'correo' => 'maria@example.com',
        ])->assertCreated()->assertJsonPath('nombre', 'María López')
            ->assertJsonPath('tiene_acceso', false)->assertJsonPath('pedidos_count', 0);

        $creado = Usuario::where('correo', 'maria@example.com')->firstOrFail();
        $this->assertSame('Cliente', $creado->rol->nombre_rol);
        $this->assertNull($creado->password_hash);

        // Sin contraseña no puede entrar a la app.
        Auth::forgetGuards();
        $this->postJson('/api/login', ['correo' => 'maria@example.com', 'password' => 'lo-que-sea-123'])->assertUnauthorized();
    }

    public function test_el_correo_es_opcional_pero_hace_falta_algun_contacto(): void
    {
        Sanctum::actingAs($this->admin);

        // Solo teléfono: se crea, sin correo.
        $this->postJson('/api/admin/clientes', ['nombre' => 'Rosa Menjívar', 'telefono' => '7000-1111'])
            ->assertCreated()->assertJsonPath('correo', null)->assertJsonPath('telefono', '7000-1111')->assertJsonPath('tiene_acceso', false);
        // Dos clientes sin correo no chocan entre sí.
        $this->postJson('/api/admin/clientes', ['nombre' => 'Pedro Sorto', 'telefono' => '7000-2222', 'correo' => ''])->assertCreated();
        $this->assertSame(2, Usuario::whereNull('correo')->count());

        // Solo correo: también vale.
        $this->postJson('/api/admin/clientes', ['nombre' => 'Sin Tel', 'correo' => 'sintel@example.com'])->assertCreated();

        // Ni teléfono ni correo: no hay cómo contactarlo.
        $this->postJson('/api/admin/clientes', ['nombre' => 'Sin Datos'])->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->postJson('/api/admin/clientes', ['nombre' => 'Sin Datos', 'telefono' => '', 'correo' => ''])->assertUnprocessable();
    }

    public function test_al_editar_no_se_pierde_el_contacto_ni_el_correo_de_quien_ya_tiene_cuenta(): void
    {
        $rosa = $this->usuario('Cliente', 'Rosa Menjívar', 'rosa@example.com', '7000-1111');
        $conCuenta = $this->usuario('Cliente', 'Lupe Cuenta', 'lupe@example.com');
        $conCuenta->forceFill(['password_hash' => 'clave-segura-123'])->save();
        Sanctum::actingAs($this->admin);

        // Puede quitarse el correo si queda el teléfono, pero no quedar sin ninguno.
        $this->patchJson('/api/admin/clientes/'.$rosa->getKey(), ['correo' => null])->assertOk()->assertJsonPath('correo', null);
        $this->patchJson('/api/admin/clientes/'.$rosa->getKey(), ['telefono' => null])->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->assertSame('7000-1111', $rosa->fresh()->telefono);

        // Con cuenta en la app, el correo es su usuario: no se quita.
        $this->patchJson('/api/admin/clientes/'.$conCuenta->getKey(), ['correo' => null, 'telefono' => '7000-9999'])
            ->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->assertSame('lupe@example.com', $conCuenta->fresh()->correo);
    }

    public function test_create_validation_and_privilege_escalation_are_rejected(): void
    {
        $this->usuario('Cliente', 'Ana', 'ana@example.com');
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/admin/clientes', [])->assertUnprocessable()->assertJsonValidationErrors('nombre');
        $this->postJson('/api/admin/clientes', ['nombre' => 'Otra Ana', 'correo' => 'ana@example.com'])
            ->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->postJson('/api/admin/clientes', ['nombre' => 'Mala', 'correo' => 'no-es-correo'])
            ->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->postJson('/api/admin/clientes', ['nombre' => 'Tel Malo', 'correo' => 't@example.com', 'telefono' => 'abc'])
            ->assertUnprocessable()->assertJsonValidationErrors('telefono');
        $this->postJson('/api/admin/clientes', ['nombre' => 'Cola Ro', 'correo' => 'c@example.com', 'id_rol' => 1])
            ->assertUnprocessable()->assertJsonValidationErrors('id_rol');
        $this->postJson('/api/admin/clientes', ['nombre' => 'Clave Ok', 'correo' => 'k@example.com', 'password' => 'abc12345'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertSame(1, Usuario::where('id_rol', Rol::where('nombre_rol', 'Cliente')->value('id_rol'))->count());
    }

    public function test_admin_updates_a_client_partially_and_cannot_touch_others(): void
    {
        $ana = $this->usuario('Cliente', 'Ana Pérez', 'ana@example.com');
        $luis = $this->usuario('Cliente', 'Luis Gómez', 'luis@example.com');
        Sanctum::actingAs($this->admin);

        $this->patchJson('/api/admin/clientes/'.$ana->getKey(), ['telefono' => '7000-3333'])
            ->assertOk()->assertJsonPath('telefono', '7000-3333')->assertJsonPath('nombre', 'Ana Pérez');
        // Conservar su propio correo no cuenta como duplicado.
        $this->patchJson('/api/admin/clientes/'.$ana->getKey(), ['correo' => 'ana@example.com', 'nombre' => 'Ana P.'])
            ->assertOk()->assertJsonPath('nombre', 'Ana P.');
        $this->patchJson('/api/admin/clientes/'.$ana->getKey(), ['correo' => $luis->correo])
            ->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->patchJson('/api/admin/clientes/'.$ana->getKey(), ['nombre' => null])->assertUnprocessable();
        $this->patchJson('/api/admin/clientes/'.$ana->getKey(), ['id_rol' => 1])->assertUnprocessable();
        $this->patchJson('/api/admin/clientes/'.$this->admin->getKey(), ['nombre' => 'Hack'])->assertNotFound();
        $this->assertSame('Admin', $this->admin->fresh()->nombre);
    }

    public function test_delete_is_blocked_when_the_client_has_orders(): void
    {
        $ana = $this->usuario('Cliente', 'Ana Pérez', 'ana@example.com');
        $luis = $this->usuario('Cliente', 'Luis Gómez', 'luis@example.com');
        $this->pedido($ana, 'Cotizado', '10.00');
        Sanctum::actingAs($this->admin);

        $this->deleteJson('/api/admin/clientes/'.$ana->getKey())->assertConflict()
            ->assertJsonPath('message', 'Este cliente tiene pedidos y no se puede eliminar para conservar su historial.');
        $this->assertNotNull(Usuario::find($ana->getKey()));

        $this->deleteJson('/api/admin/clientes/'.$luis->getKey())->assertNoContent();
        $this->assertNull(Usuario::find($luis->getKey()));
        $this->deleteJson('/api/admin/clientes/'.$this->admin->getKey())->assertNotFound();
    }
}
