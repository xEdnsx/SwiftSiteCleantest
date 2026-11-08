<?php

namespace Tests\Feature;

use App\Mail\ReclamarCuenta;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Mail\MailManager;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['mail.default' => 'smtp']);
        Mail::fake();

        foreach (['roles', 'usuarios', 'personal_access_tokens', 'categorias_servicio'] as $table) {
            (require glob(database_path("migrations/*_create_{$table}_table.php"))[0])->up();
        }
        (require glob(database_path('migrations/*_add_consentimiento_to_usuarios.php'))[0])->up();
        (require glob(database_path('migrations/*_permitir_cliente_sin_correo.php'))[0])->up();
    }

    private function credentials(): array
    {
        return [
            'nombre' => 'Cliente prueba', 'correo' => 'cliente@example.com',
            'password' => 'clave-segura-123', 'password_confirmation' => 'clave-segura-123',
            'acepta_terminos' => true,
        ];
    }

    private function bearer(string $token): static
    {
        Auth::forgetGuards();

        return $this->withToken($token);
    }

    public function test_registration_issues_token_and_assigns_client_role(): void
    {
        $response = $this->postJson('/api/register', $this->credentials())
            ->assertCreated()->assertJsonPath('usuario.rol.nombre_rol', 'Cliente')
            ->assertJsonPath('token_type', 'Bearer')->assertJsonMissingPath('usuario.password_hash');
        $usuario = Usuario::firstOrFail();
        $this->assertTrue(Hash::check($this->credentials()['password'], $usuario->password_hash));
        $this->assertNotNull(PersonalAccessToken::findToken($response->json('token')));
        $this->bearer($response->json('token'))->get('/api/me')->assertOk()->assertJsonPath('correo', 'cliente@example.com');
        $this->bearer($response->json('token'))->postJson('/api/categorias', ['nombre' => 'Sillas'])->assertForbidden();
    }

    public function test_un_cliente_agregado_desde_el_panel_reclama_su_cuenta_al_registrarse(): void
    {
        $rol = Rol::firstOrCreate(['nombre_rol' => 'Cliente']);
        $agregado = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Ana (panel)', 'telefono' => '7000-1111', 'correo' => 'cliente@example.com']);
        $this->assertNull($agregado->password_hash);
        $anterior = $agregado->createToken('legacy')->plainTextToken;

        $this->postJson('/api/register', $this->credentials())->assertStatus(202)->assertJsonMissingPath('token');
        $this->assertNull($agregado->fresh()->password_hash);
        $this->assertSame('Ana (panel)', $agregado->fresh()->nombre);
        Mail::assertSent(ReclamarCuenta::class, fn ($mail) => $mail->hasTo('cliente@example.com'));
        $codigo = Mail::sent(ReclamarCuenta::class)->first()->codigo;
        $respuesta = $this->postJson('/api/register', $this->credentials() + ['claim_token' => $codigo])->assertCreated()->assertJsonPath('usuario.nombre', 'Cliente prueba');

        // Es la misma persona: no se duplica, conserva su teléfono y ahora puede entrar.
        $this->assertSame(1, Usuario::count());
        $agregado->refresh();
        $this->assertSame($agregado->getKey(), $respuesta->json('usuario.id_usuario'));
        $this->assertSame('7000-1111', $agregado->telefono);
        $this->assertTrue(Hash::check('clave-segura-123', $agregado->password_hash));
        $this->assertNotNull($agregado->terminos_aceptados_en);
        $this->assertNull(PersonalAccessToken::findToken($anterior));
        $this->postJson('/api/login', ['correo' => 'cliente@example.com', 'password' => 'clave-segura-123'])->assertOk();

        // Una vez reclamada, nadie más puede registrarse con ese correo.
        $this->postJson('/api/register', $this->credentials())->assertUnprocessable()->assertJsonValidationErrors('correo');
    }

    public function test_una_cuenta_sin_contrasena_que_no_es_de_cliente_no_se_puede_reclamar(): void
    {
        $admin = Rol::firstOrCreate(['nombre_rol' => 'Administrador']);
        Usuario::create(['id_rol' => $admin->getKey(), 'nombre' => 'Admin', 'correo' => 'cliente@example.com']);

        $this->postJson('/api/register', $this->credentials())->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->assertNull(Usuario::firstOrFail()->password_hash);
        Mail::assertNothingSent();
    }

    public function test_claim_code_cannot_be_forged_expired_replayed_or_used_for_another_email(): void
    {
        $rol = Rol::create(['nombre_rol' => 'Cliente']);
        $usuario = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Original', 'correo' => 'cliente@example.com']);
        $this->postJson('/api/register', $this->credentials())->assertStatus(202);
        $codigo = Mail::sent(ReclamarCuenta::class)->first()->codigo;
        $this->postJson('/api/register', $this->credentials() + ['claim_token' => 'falso'])->assertUnprocessable();
        $this->assertNull($usuario->fresh()->password_hash);
        $this->assertSame(0, PersonalAccessToken::count());
        $this->travel(31)->minutes();
        $this->postJson('/api/register', $this->credentials() + ['claim_token' => $codigo])->assertUnprocessable();
        $this->travelBack();
        $usuario->update(['correo' => 'otro@example.com']);
        $this->postJson('/api/register', array_replace($this->credentials(), ['correo' => 'otro@example.com', 'claim_token' => $codigo]))->assertUnprocessable();
        $usuario->update(['correo' => 'cliente@example.com']);
        $this->postJson('/api/register', $this->credentials() + ['claim_token' => $codigo])->assertCreated();
        $this->postJson('/api/register', $this->credentials() + ['claim_token' => $codigo])->assertUnprocessable();
    }

    public function test_claim_resend_is_throttled_and_does_not_change_the_account(): void
    {
        $rol = Rol::create(['nombre_rol' => 'Cliente']);
        $usuario = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Original', 'correo' => 'cliente@example.com']);
        $this->postJson('/api/register', $this->credentials())->assertStatus(202);
        $this->postJson('/api/register', $this->credentials())->assertStatus(202);
        Mail::assertSentCount(1);
        $this->assertNull($usuario->fresh()->password_hash);
        $this->assertSame('Original', $usuario->fresh()->nombre);
    }

    public function test_log_mail_transport_fails_closed_without_changing_the_account(): void
    {
        config(['mail.default' => 'log']);
        Mail::swap(new MailManager($this->app));
        $rol = Rol::create(['nombre_rol' => 'Cliente']);
        $usuario = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Original', 'correo' => 'cliente@example.com']);
        $this->postJson('/api/register', $this->credentials())->assertStatus(503);
        $this->assertNull($usuario->fresh()->password_hash);
        $this->assertSame(0, PersonalAccessToken::count());
    }

    public function test_registration_validation_and_role_escalation_are_rejected(): void
    {
        $this->postJson('/api/register', $this->credentials() + ['id_rol' => 1])->assertUnprocessable()->assertJsonValidationErrors('id_rol');
        $this->postJson('/api/register', array_replace($this->credentials(), ['password_confirmation' => 'otra']))->assertUnprocessable();
        $this->postJson('/api/register', $this->credentials())->assertCreated();
        $this->postJson('/api/register', $this->credentials())->assertUnprocessable()->assertJsonValidationErrors('correo');
        $this->assertSame(1, Usuario::count());
    }

    public function test_login_logout_revokes_only_current_token(): void
    {
        $first = $this->postJson('/api/register', $this->credentials())->assertCreated()->json('token');
        $second = $this->postJson('/api/login', $this->credentials())->assertOk()->json('token');
        $this->assertNotSame($first, $second);
        $this->bearer($second)->post('/api/logout')->assertNoContent();
        $this->assertNull(PersonalAccessToken::findToken($second));
        $this->bearer($second)->get('/api/me')->assertUnauthorized();
        $this->bearer($first)->get('/api/user')->assertOk()->assertJsonMissingPath('password_hash');
    }

    public function test_invalid_credentials_missing_tokens_and_expired_tokens_are_rejected(): void
    {
        $this->postJson('/api/login', $this->credentials())->assertUnauthorized();
        $token = $this->postJson('/api/register', $this->credentials())->json('token');
        $this->postJson('/api/login', array_replace($this->credentials(), ['password' => 'incorrecta']))->assertUnauthorized();
        $this->get('/api/me')->assertUnauthorized()->assertHeader('Content-Type', 'application/json');
        $this->post('/api/logout')->assertUnauthorized();
        $this->bearer('invalid-token')->get('/api/me')->assertUnauthorized();
        $this->travel(8)->days();
        $this->bearer($token)->get('/api/me')->assertUnauthorized();
    }

    public function test_admin_role_is_checked_on_each_request_with_real_tokens(): void
    {
        $admin = Rol::create(['nombre_rol' => 'Administrador']);
        $usuario = Usuario::create([
            'id_rol' => $admin->getKey(), 'nombre' => 'Admin', 'correo' => 'admin@example.com',
            'password_hash' => 'clave-segura-123',
        ]);
        $token = $this->postJson('/api/login', ['correo' => $usuario->correo, 'password' => 'clave-segura-123'])->assertOk()->json('token');
        $this->bearer($token)->postJson('/api/categorias', ['nombre' => 'Sillas'])->assertCreated();
        $cliente = Rol::create(['nombre_rol' => 'Cliente']);
        $usuario->update(['id_rol' => $cliente->getKey()]);
        $this->bearer($token)->postJson('/api/categorias', ['nombre' => 'Muebles'])->assertForbidden();
    }

    public function test_login_and_registration_are_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', $this->credentials())->assertUnauthorized();
        }
        $this->postJson('/api/login', $this->credentials())->assertTooManyRequests();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/register', [])->assertUnprocessable();
        }
        $this->postJson('/api/register', [])->assertTooManyRequests();
    }

    public function test_wrong_portal_role_is_rejected_without_issuing_token(): void
    {
        $this->postJson('/api/register', $this->credentials())->assertCreated();
        $count = PersonalAccessToken::count();
        $this->postJson('/api/login', $this->credentials() + ['portal' => 'administrador'])->assertForbidden();
        $this->assertSame($count, PersonalAccessToken::count());
        $this->postJson('/api/login', $this->credentials() + ['portal' => 'cliente'])->assertOk();
    }
}
