<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:25'],
            'correo' => ['required', 'string', 'email', 'max:150', 'unique:usuarios,correo'],
            'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed'],
            'device_name' => ['sometimes', 'required', 'string', 'max:100'],
            'id_rol' => ['prohibited'],
            'rol' => ['prohibited'],
            'password_hash' => ['prohibited'],
        ]);

        return DB::transaction(function () use ($data): JsonResponse {
            $rol = Rol::firstOrCreate(['nombre_rol' => 'Cliente']);
            $usuario = Usuario::create([
                'id_rol' => $rol->getKey(),
                'nombre' => $data['nombre'],
                'telefono' => $data['telefono'] ?? null,
                'correo' => $data['correo'],
                'password_hash' => $data['password'],
            ]);

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
