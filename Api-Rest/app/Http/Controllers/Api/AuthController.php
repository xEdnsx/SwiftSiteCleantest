<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ReclamarCuenta;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:25'],
            'correo' => ['required', 'string', 'email', 'max:150'],
            'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed'],
            // Consentimiento informado: sin aceptar los términos y la privacidad no se crea la cuenta.
            'acepta_terminos' => ['required', 'accepted'],
            'device_name' => ['sometimes', 'required', 'string', 'max:100'],
            'id_rol' => ['prohibited'],
            'rol' => ['prohibited'],
            'password_hash' => ['prohibited'],
            'claim_token' => ['sometimes', 'required', 'string', 'max:4096'],
        ]);

        return DB::transaction(function () use ($data): JsonResponse {
            $rol = Rol::firstOrCreate(['nombre_rol' => 'Cliente']);
            $datosCuenta = [
                'nombre' => $data['nombre'],
                'telefono' => $data['telefono'] ?? null,
                'password_hash' => $data['password'],
                'terminos_version' => config('legal.version'),
                'terminos_aceptados_en' => now(),
            ];

            // Tener el correo no demuestra su propiedad: no cambiar la cuenta hasta verificar el código.
            $existente = Usuario::where('correo', $data['correo'])->lockForUpdate()->first();
            if ($existente) {
                if ($existente->password_hash !== null || $existente->id_rol !== $rol->getKey()) {
                    throw ValidationException::withMessages(['correo' => trans('validation.unique', ['attribute' => 'correo'])]);
                }
                if (! isset($data['claim_token'])) {
                    return $this->solicitarVerificacion($existente);
                }
                $this->verificarReclamacion($existente, $data['claim_token']);
                $existente->tokens()->delete();
                $existente->update(array_replace($datosCuenta, ['telefono' => $datosCuenta['telefono'] ?? $existente->telefono]));

                return $this->tokenResponse($existente, $data['device_name'] ?? 'api', 201);
            }

            if (isset($data['claim_token'])) {
                throw ValidationException::withMessages(['claim_token' => 'El codigo no es valido o ha caducado.']);
            }
            $usuario = Usuario::create($datosCuenta + ['id_rol' => $rol->getKey(), 'correo' => $data['correo']]);

            return $this->tokenResponse($usuario, $data['device_name'] ?? 'api', 201);
        });
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'correo' => ['required', 'string', 'email', 'max:150'],
            'password' => ['required', 'string', 'max:72'],
            'device_name' => ['sometimes', 'required', 'string', 'max:100'],
            'portal' => ['sometimes', 'required', 'in:administrador,cliente'],
        ]);

        $usuario = Usuario::where('correo', $data['correo'])->first();
        if (! $usuario || ! $usuario->password_hash || ! Hash::check($data['password'], $usuario->password_hash)) {
            return response()->json(['message' => 'Credenciales incorrectas.'], 401);
        }

        $expectedRole = match ($data['portal'] ?? null) {
            'administrador' => 'Administrador',
            'cliente' => 'Cliente',
            default => null,
        };
        if ($expectedRole && ! $usuario->rol()->where('nombre_rol', $expectedRole)->exists()) {
            return response()->json(['message' => 'Esta cuenta no tiene acceso a esta aplicacion.'], 403);
        }

        if (Hash::needsRehash($usuario->password_hash)) {
            $usuario->forceFill(['password_hash' => Hash::make($data['password'])])->save();
        }

        return $this->tokenResponse($usuario, $data['device_name'] ?? 'api');
    }

    private function solicitarVerificacion(Usuario $usuario): JsonResponse
    {
        // El transporte log guardaría el secreto en disco: exigir correo real fuera de las pruebas.
        abort_if(in_array(config('mail.default'), ['log', 'array'], true),
            503, 'La activacion por correo no esta disponible. Contacta con soporte.');
        $key = 'claim:'.hash('sha256', (string) $usuario->correo);
        if (! RateLimiter::tooManyAttempts($key, 1)) {
            RateLimiter::hit($key, 60);
            $codigo = Crypt::encryptString(json_encode([
                'id' => $usuario->getKey(),
                'correo' => hash('sha256', $usuario->correo),
                'expires' => now()->addMinutes(30)->getTimestamp(),
            ], JSON_THROW_ON_ERROR));
            Mail::to($usuario->correo)->send(new ReclamarCuenta($codigo));
        }

        return response()->json([
            'verification_required' => true,
            'message' => 'Revisa tu correo e introduce el codigo de activacion. Si ya lo solicitaste, espera un minuto antes de reenviarlo.',
        ], 202)->header('Cache-Control', 'no-store');
    }

    private function verificarReclamacion(Usuario $usuario, string $codigo): void
    {
        try {
            $datos = json_decode(Crypt::decryptString($codigo), true, 512, JSON_THROW_ON_ERROR);
            $valido = is_array($datos)
                && ($datos['id'] ?? null) === $usuario->getKey()
                && is_int($datos['expires'] ?? null)
                && $datos['expires'] > now()->getTimestamp()
                && hash_equals(hash('sha256', $usuario->correo), (string) ($datos['correo'] ?? ''));
        } catch (DecryptException|\JsonException) {
            $valido = false;
        }
        if (! $valido) {
            throw ValidationException::withMessages(['claim_token' => 'El codigo no es valido o ha caducado.']);
        }
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('rol'));
    }

    public function logout(Request $request): Response
    {
        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->noContent();
    }

    private function tokenResponse(Usuario $usuario, string $deviceName, int $status = 200): JsonResponse
    {
        $expiresAt = now()->addDays(7);
        $token = $usuario->createToken($deviceName, ['*'], $expiresAt);

        return response()->json([
            'usuario' => $usuario->load('rol'),
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
        ], $status)->header('Cache-Control', 'no-store');
    }
}
