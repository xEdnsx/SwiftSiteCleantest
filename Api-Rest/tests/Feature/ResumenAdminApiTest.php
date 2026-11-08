<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Rol;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\TablasDePedidos;
use Tests\TestCase;

class ResumenAdminApiTest extends TestCase
{
    use TablasDePedidos;

    private Usuario $admin;

    private Usuario $cliente;

    private ZonaCobertura $zona;

    protected function setUp(): void
    {
        parent::setUp();
        $this->armarTablasDePedidos();

        $this->zona = ZonaCobertura::create(['nombre' => 'Centro']);
        $this->admin = $this->usuario('Administrador', 'admin@example.com');
        $this->cliente = $this->usuario('Cliente', 'cliente@example.com');
        $this->usuario('Cliente', 'otro@example.com');
    }

    private function usuario(string $rol, string $correo): Usuario
    {
        $modelo = Rol::firstOrCreate(['nombre_rol' => $rol]);

        return Usuario::create(['id_rol' => $modelo->getKey(), 'nombre' => ucfirst($rol), 'correo' => $correo]);
    }

    private function pedido(string $fecha, string $estado, string $total, string $franja = '8:00 a. m.'): Pedido
    {
        return Pedido::create([
            'id_usuario' => $this->cliente->getKey(), 'id_zona' => $this->zona->getKey(), 'direccion' => 'Colonia Escalón, casa 12',
            'fecha_servicio' => $fecha, 'franja_horaria' => $franja, 'fecha_creacion' => now(), 'estado' => $estado,
            'subtotal' => $total, 'recargo_zona' => '0.00', 'total' => $total,
        ]);
    }

    public function test_el_resumen_cuenta_solo_lo_que_corresponde(): void
    {
        $this->pedido('2026-11-05', 'Cotizado', '10.00');       // hoy, por confirmar
        $this->pedido('2026-11-05', 'En proceso', '20.00');     // hoy
        $this->pedido('2026-11-20', 'Finalizado', '30.50');     // este mes, finalizado -> ingreso
        $this->pedido('2026-11-02', 'Finalizado', '40.25');     // este mes, finalizado -> ingreso
        $this->pedido('2026-10-30', 'Finalizado', '99.00');     // mes anterior: no cuenta
        $this->pedido('2026-11-25', 'Confirmado', '77.00');     // este mes pero sin finalizar: no cuenta
        $this->pedido('2026-12-01', 'Cotizado', '5.00');        // otro mes, por confirmar

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/resumen?fecha=2026-11-05')->assertOk()
            ->assertJsonPath('fecha', '2026-11-05')
            ->assertJsonPath('pedidos_hoy', 2)
            ->assertJsonPath('por_confirmar', 2)
            ->assertJsonPath('ingresos_mes', '70.75')
            ->assertJsonPath('clientes', 2)
            ->assertJsonCount(5, 'recientes')
            ->assertJsonCount(2, 'agenda_hoy')
            ->assertJsonPath('agenda_hoy.0.usuario.nombre', 'Cliente');
    }

    public function test_sin_pedidos_todo_es_cero(): void
    {
        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/resumen?fecha=2026-11-05')->assertOk()
            ->assertJsonPath('pedidos_hoy', 0)
            ->assertJsonPath('por_confirmar', 0)
            ->assertJsonPath('ingresos_mes', '0.00')
            ->assertJsonCount(0, 'recientes')
            ->assertJsonCount(0, 'agenda_hoy');
    }

    public function test_exige_fecha_valida_y_rol_administrador(): void
    {
        $this->getJson('/api/admin/resumen?fecha=2026-11-05')->assertUnauthorized();

        Sanctum::actingAs($this->cliente);
        $this->getJson('/api/admin/resumen?fecha=2026-11-05')->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/resumen')->assertUnprocessable()->assertJsonValidationErrors('fecha');
        $this->getJson('/api/admin/resumen?fecha=hoy')->assertUnprocessable();
        $this->getJson('/api/admin/resumen?fecha=05/11/2026')->assertUnprocessable();
    }
}
