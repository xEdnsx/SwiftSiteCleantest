<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Rol;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\Concerns\TablasDePedidos;
use Tests\TestCase;

class PerfilApiTest extends TestCase
{
    use TablasDePedidos;

    private const CLAVE = 'ClaveActual1';

    protected function setUp(): void
    {
        parent::setUp();
        $this->armarTablasDePedidos();
    }

    private function cliente(string $correo = 'ana@example.com'): Usuario
    {
        $rol = Rol::firstOrCreate(['nombre_rol' => 'Cliente']);

        return Usuario::create([
            'id_rol' => $rol->getKey(), 'nombre' => 'Ana Martínez', 'telefono' => '7777-0000',
            'correo' => $correo, 'password_hash' => self::CLAVE,
        ]);
    }

    private function token(Usuario $usuario): string
    {
        Auth::forgetGuards();

        return $usuario->createToken('prueba')->plainTextToken;
    }

    private function con(string $token): static
    {
        Auth::forgetGuards();

        return $this->withToken($token);
    }

    private function pedido(Usuario $usuario, string $estado): Pedido
    {
        $zona = ZonaCobertura::firstOrCreate(['nombre' => 'Centro']);

        return Pedido::create([
            'id_usuario' => $usuario->getKey(), 'id_zona' => $zona->getKey(), 'direccion' => 'Colonia Escalón, casa 12',
            'fecha_servicio' => '2026-11-10', 'franja_horaria' => '10:00', 'estado' => $estado,
            'subtotal' => 40, 'recargo_zona' => 0, 'total' => 40,
        ]);
    }

    public function test_registration_requires_consent_and_records_which_version_was_accepted(): void
    {
        $base = ['nombre' => 'Luis Gómez', 'correo' => 'luis@example.com', 'password' => 'clave-segura-123', 'password_confirmation' => 'clave-segura-123'];

        $this->postJson('/api/register', $base)->assertUnprocessable()->assertJsonValidationErrors('acepta_terminos');
        $this->postJson('/api/register', $base + ['acepta_terminos' => false])->assertUnprocessable()->assertJsonValidationErrors('acepta_terminos');
        $this->assertSame(0, Usuario::count());

        $this->postJson('/api/register', $base + ['acepta_terminos' => true])->assertCreated();
        $usuario = Usuario::firstOrFail();
        $this->assertSame(config('legal.version'), $usuario->terminos_version);
        $this->assertNotNull($usuario->terminos_aceptados_en);
    }

    public function test_profile_updates_name_and_phone_but_not_email_or_role(): void
    {
        $ana = $this->cliente();
        $token = $this->token($ana);

        $this->con($token)->patchJson('/api/me', ['nombre' => 'Ana M. Martínez', 'telefono' => '7000-1111'])
            ->assertOk()->assertJsonPath('nombre', 'Ana M. Martínez')->assertJsonPath('telefono', '7000-1111')
            ->assertJsonPath('rol.nombre_rol', 'Cliente')->assertJsonMissingPath('password_hash');
        $this->con($token)->patchJson('/api/me', ['telefono' => null])->assertOk()->assertJsonPath('telefono', null);
        $this->con($token)->patchJson('/api/me', ['nombre' => ''])->assertUnprocessable();
        $this->con($token)->patchJson('/api/me', ['telefono' => 'abc'])->assertUnprocessable();
        foreach (['correo' => 'otro@example.com', 'id_rol' => 1, 'password' => 'Nueva1234'] as $campo => $valor) {
            $this->con($token)->patchJson('/api/me', [$campo => $valor])->assertUnprocessable()->assertJsonValidationErrors($campo);
        }
        $this->assertSame('ana@example.com', $ana->fresh()->correo);
        $this->postJson('/api/me', [])->assertStatus(405);
        Auth::forgetGuards();
        $this->flushHeaders();
        $this->patchJson('/api/me', ['nombre' => 'X Y'])->assertUnauthorized();
    }

    public function test_changing_password_needs_the_current_one_and_a_strong_new_one(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class); // el límite tiene su propia prueba
        $ana = $this->cliente();
        $token = $this->token($ana);
        $ok = ['current_password' => self::CLAVE, 'password' => 'NuevaClave9', 'password_confirmation' => 'NuevaClave9'];

        $this->con($token)->putJson('/api/me/password', ['current_password' => 'incorrecta'] + $ok)
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->con($token)->putJson('/api/me/password', array_replace($ok, ['password' => 'sinmayuscula9', 'password_confirmation' => 'sinmayuscula9']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->con($token)->putJson('/api/me/password', array_replace($ok, ['password' => 'SinNumeroAqui', 'password_confirmation' => 'SinNumeroAqui']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->con($token)->putJson('/api/me/password', array_replace($ok, ['password' => 'Corta1', 'password_confirmation' => 'Corta1']))
            ->assertUnprocessable();
        $this->con($token)->putJson('/api/me/password', array_replace($ok, ['password_confirmation' => 'Distinta123']))
            ->assertUnprocessable();
        $this->con($token)->putJson('/api/me/password', array_replace($ok, ['password' => self::CLAVE, 'password_confirmation' => self::CLAVE]))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check(self::CLAVE, $ana->fresh()->password_hash));

        $this->con($token)->putJson('/api/me/password', $ok)->assertOk();
        $this->assertTrue(Hash::check('NuevaClave9', $ana->fresh()->password_hash));
        Auth::forgetGuards();
        $this->postJson('/api/login', ['correo' => 'ana@example.com', 'password' => 'NuevaClave9'])->assertOk();
    }

    public function test_password_attempts_are_rate_limited_to_slow_down_guessing(): void
    {
        $token = $this->token($this->cliente());

        for ($i = 0; $i < 6; $i++) {
            $this->con($token)->putJson('/api/me/password', [
                'current_password' => 'adivinando'.$i, 'password' => 'NuevaClave9', 'password_confirmation' => 'NuevaClave9',
            ])->assertUnprocessable();
        }
        $this->con($token)->putJson('/api/me/password', [
            'current_password' => self::CLAVE, 'password' => 'NuevaClave9', 'password_confirmation' => 'NuevaClave9',
        ])->assertTooManyRequests();
    }

    public function test_changing_password_closes_every_other_session_but_keeps_the_current_one(): void
    {
        $ana = $this->cliente();
        $actual = $this->token($ana);
        $otraSesion = $this->token($ana);

        $this->con($actual)->putJson('/api/me/password', [
            'current_password' => self::CLAVE, 'password' => 'NuevaClave9', 'password_confirmation' => 'NuevaClave9',
        ])->assertOk();

        $this->assertNotNull(PersonalAccessToken::findToken($actual));
        $this->assertNull(PersonalAccessToken::findToken($otraSesion));
        $this->con($actual)->getJson('/api/me')->assertOk();
        $this->con($otraSesion)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_a_client_without_orders_can_delete_the_account_completely(): void
    {
        $ana = $this->cliente();
        $token = $this->token($ana);

        $this->con($token)->deleteJson('/api/me', [])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->con($token)->deleteJson('/api/me', ['password' => 'incorrecta'])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertNotNull(Usuario::find($ana->getKey()));

        $this->con($token)->deleteJson('/api/me', ['password' => self::CLAVE])->assertNoContent();
        $this->assertNull(Usuario::find($ana->getKey()));
        $this->assertSame(0, PersonalAccessToken::count());
    }

    public function test_a_client_with_finished_orders_is_anonymized_and_keeps_the_business_history(): void
    {
        $ana = $this->cliente();
        $pedido = $this->pedido($ana, 'Finalizado');
        $token = $this->token($ana);

        $this->con($token)->deleteJson('/api/me', ['password' => self::CLAVE])->assertNoContent();

        $ana = $ana->fresh();
        $this->assertSame('Cliente eliminado', $ana->nombre);
        $this->assertNull($ana->telefono);
        $this->assertNull($ana->password_hash);
        $this->assertStringNotContainsString('ana', $ana->correo);
        $this->assertSame('Dirección eliminada por el titular', $pedido->fresh()->direccion);
        $this->assertSame('Finalizado', $pedido->fresh()->estado);
        $this->assertSame(0, PersonalAccessToken::count());
        Auth::forgetGuards();
        $this->postJson('/api/login', ['correo' => 'ana@example.com', 'password' => self::CLAVE])->assertUnauthorized();
    }

    public function test_an_account_with_orders_in_progress_cannot_be_deleted_yet(): void
    {
        $ana = $this->cliente();
        $this->pedido($ana, 'En proceso');
        $token = $this->token($ana);

        $this->con($token)->deleteJson('/api/me', ['password' => self::CLAVE])->assertConflict()
            ->assertJsonPath('message', 'Tienes pedidos en curso. Podrás eliminar tu cuenta cuando terminen.');
        $this->assertSame('Ana Martínez', $ana->fresh()->nombre);
    }

    public function test_administrators_cannot_delete_their_account_from_the_app(): void
    {
        $rol = Rol::create(['nombre_rol' => 'Administrador']);
        $admin = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Admin', 'correo' => 'admin@example.com', 'password_hash' => self::CLAVE]);

        $this->con($this->token($admin))->deleteJson('/api/me', ['password' => self::CLAVE])->assertForbidden();
        $this->assertNotNull(Usuario::find($admin->getKey()));
    }
}
