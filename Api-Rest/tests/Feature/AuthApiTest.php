<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['roles', 'usuarios', 'personal_access_tokens', 'categorias_servicio'] as $table) {
            (require glob(database_path("migrations/*_create_{$table}_table.php"))[0])->up();
        }
    }

    private function credentials(): array
    {
        return [
            'nombre' => 'Cliente prueba', 'correo' => 'cliente@example.com',
            'password' => 'clave-segura-123', 'password_confirmation' => 'clave-segura-123',
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
