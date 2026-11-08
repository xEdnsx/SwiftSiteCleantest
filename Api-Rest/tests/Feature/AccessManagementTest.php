<?php

namespace Tests\Feature;

use App\Mail\RecuperarPassword;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AccessManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['mail.default' => 'smtp']);
        Mail::fake();
        foreach (['users', 'roles', 'usuarios', 'personal_access_tokens'] as $table) {
            (require glob(database_path("migrations/*_create_{$table}_table.php"))[0])->up();
        }
    }

    private function user(string $role = 'Administrador'): Usuario
    {
        return Usuario::create(['id_rol' => Rol::firstOrCreate(['nombre_rol' => $role])->getKey(), 'nombre' => 'Prueba', 'correo' => uniqid().'@example.invalid', 'password_hash' => 'Original-123']);
    }

    public function test_both_roles_can_reset_only_with_valid_single_use_code_and_revoke_sessions(): void
    {
        foreach (['Administrador', 'Cliente'] as $role) {
            Cache::flush();
            $user = $this->user($role);
            $old = $user->createToken('old')->plainTextToken;
            $this->postJson('/api/forgot-password', ['correo' => $user->correo])->assertOk()->assertJsonMissingPath('token');
            $mail = Mail::sent(RecuperarPassword::class)->last();
            $this->assertTrue($mail->hasTo($user->correo));
            $this->assertNotSame($mail->codigo, DB::table('password_reset_tokens')->where('email', $user->correo)->value('token'));
            $data = ['correo' => $user->correo, 'token' => $mail->codigo, 'password' => 'Changed-123', 'password_confirmation' => 'Changed-123'];
            $this->postJson('/api/reset-password', array_replace($data, ['token' => 'invalid']))->assertUnprocessable();
            $this->postJson('/api/reset-password', array_replace($data, ['password_confirmation' => 'different']))->assertUnprocessable();
            $this->assertTrue(Hash::check('Original-123', $user->fresh()->password_hash));
            $this->postJson('/api/reset-password', $data)->assertOk();
            $this->assertNull(PersonalAccessToken::findToken($old));
            $this->assertTrue(Hash::check('Changed-123', $user->fresh()->password_hash));
            $this->postJson('/api/reset-password', $data)->assertUnprocessable();
            $this->postJson('/api/login', ['correo' => $user->correo, 'password' => 'Original-123'])->assertUnauthorized();
            $this->postJson('/api/login', ['correo' => $user->correo, 'password' => 'Changed-123'])->assertOk();
        }
    }

    public function test_expiry_email_binding_and_resend_cooldown(): void
    {
        $user = $this->user();
        $other = $this->user();
        $this->postJson('/api/forgot-password', ['correo' => $user->correo])->assertOk();
        $code = Mail::sent(RecuperarPassword::class)->first()->codigo;
        $this->postJson('/api/forgot-password', ['correo' => $user->correo])->assertOk();
        Mail::assertSentCount(1);
        $data = ['correo' => $other->correo, 'token' => $code, 'password' => 'Changed-123', 'password_confirmation' => 'Changed-123'];
        $this->postJson('/api/reset-password', $data)->assertUnprocessable();
        DB::table('password_reset_tokens')->where('email', $user->correo)->update(['created_at' => now()->subMinutes(31)]);
        $data['correo'] = $user->correo;
        $this->postJson('/api/reset-password', $data)->assertUnprocessable();
        $this->postJson('/api/forgot-password', ['correo' => $user->correo])->assertOk();
        Mail::assertSentCount(2);
        $this->postJson('/api/reset-password', $data)->assertUnprocessable();
    }

    public function test_unknown_email_is_generic_and_log_mail_fails_closed(): void
    {
        $user = $this->user();
        $expected = $this->postJson('/api/forgot-password', ['correo' => $user->correo])->assertOk()->json();
        $this->postJson('/api/forgot-password', ['correo' => 'unknown@example.invalid'])->assertOk()->assertExactJson($expected);
        Mail::assertSentCount(1);
        config(['mail.default' => 'log']);
        $this->postJson('/api/forgot-password', ['correo' => $user->correo])->assertStatus(503);
    }

    public function test_only_admin_id_one_can_list_and_create_administrators(): void
    {
        $principal = $this->user();
        $admin = $this->user();
        $client = $this->user('Cliente');
        $this->assertSame(1, $principal->getKey());
        $data = ['nombre' => 'Nuevo', 'correo' => 'new@example.invalid', 'password' => 'Initial-123', 'password_confirmation' => 'Initial-123'];
        $this->postJson('/api/admin/administradores', $data)->assertUnauthorized();
        foreach ([$admin, $client] as $user) {
            Auth::forgetGuards();
            $this->withToken($user->createToken('test')->plainTextToken)->postJson('/api/admin/administradores', $data)->assertForbidden();
            $this->getJson('/api/admin/administradores')->assertForbidden();
        }
        Auth::forgetGuards();
        $this->withToken($principal->createToken('test')->plainTextToken)->postJson('/api/admin/administradores', $data + ['id_rol' => $client->id_rol])->assertUnprocessable();
        $this->postJson('/api/admin/administradores', $data)->assertCreated()->assertJsonPath('rol.nombre_rol', 'Administrador')->assertJsonMissingPath('password_hash');
        $this->getJson('/api/admin/administradores')->assertOk()->assertJsonCount(3);
        $this->postJson('/api/admin/administradores', $data)->assertUnprocessable();
        $created = Usuario::where('correo', $data['correo'])->firstOrFail();
        $this->assertTrue(Hash::check('Initial-123', $created->password_hash));
        Auth::forgetGuards();
        $this->withToken($created->createToken('new')->plainTextToken)->postJson('/api/admin/administradores', array_replace($data, ['correo' => 'other@example.invalid']))->assertForbidden();
        // Even id 1 cannot administer accounts after losing the admin role.
        $principal->update(['id_rol' => $client->id_rol]);
        Auth::forgetGuards();
        $this->withToken($principal->createToken('changed')->plainTextToken)->getJson('/api/admin/administradores')->assertForbidden();
    }
}
