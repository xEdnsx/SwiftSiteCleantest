<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Reporte;
use App\Models\Valoracion;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

/** Perfil de la persona autenticada: sus datos, su contraseña y su derecho a eliminar la cuenta. */
class PerfilController extends Controller
{
    /** El correo no se cambia aquí (identifica la cuenta): se pide por soporte. */
    public function update(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:25', 'regex:/^[0-9+\-\s()]{7,25}$/'],
            'correo' => ['prohibited'],
            'id_rol' => ['prohibited'],
            'password' => ['prohibited'],
            'password_hash' => ['prohibited'],
        ]);

        $request->user()->update($datos);

        return response()->json($request->user()->fresh()->load('rol'));
    }

    public function cambiarPassword(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'current_password' => ['required', 'string', 'max:72'],
            'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed', 'different:current_password', 'regex:/[A-Z]/', 'regex:/[0-9]/'],
        ], [
            'password.regex' => 'La nueva contraseña debe tener al menos una mayúscula y un número.',
            'password.different' => 'La nueva contraseña debe ser distinta de la actual.',
        ]);

        $usuario = $request->user();
        $this->exigirPassword($usuario, $datos['current_password'], 'current_password');

        $usuario->update(['password_hash' => $datos['password']]);

        // Cierra las demás sesiones: si alguien más tenía la cuenta, deja de tener acceso.
        $actual = $usuario->currentAccessToken();
        $usuario->tokens()
            ->when($actual instanceof PersonalAccessToken, fn ($q) => $q->where('id', '!=', $actual->getKey()))
            ->delete();

        return response()->json(['message' => 'Contraseña actualizada.']);
    }

    /**
     * Elimina la cuenta (derecho de cancelación). Si la persona ya tiene pedidos, no se borra la fila
     * (el historial del negocio depende de ella): se anonimiza y se borran sus datos personales.
     */
    public function destroy(Request $request): JsonResponse|Response
    {
        $datos = $request->validate(['password' => ['required', 'string', 'max:72']]);
        $usuario = $request->user();

        if (! $usuario->rol()->where('nombre_rol', 'Cliente')->exists()) {
            return response()->json(['message' => 'Esta cuenta no se puede eliminar desde la aplicación.'], 403);
        }
        $this->exigirPassword($usuario, $datos['password'], 'password');

        $enCurso = Pedido::where('id_usuario', $usuario->getKey())->whereIn('estado', ['Confirmado', 'En proceso'])->exists();
        if ($enCurso) {
            return response()->json([
                'message' => 'Tienes pedidos en curso. Podrás eliminar tu cuenta cuando terminen.',
            ], 409);
        }

        DB::transaction(function () use ($usuario) {
            $usuario->tokens()->delete();

            if (Pedido::where('id_usuario', $usuario->getKey())->exists()) {
                Pedido::where('id_usuario', $usuario->getKey())->update(['direccion' => 'Dirección eliminada por el titular']);
                Reporte::where('id_usuario', $usuario->getKey())->update(['descripcion' => 'Texto eliminado por el titular']);
                Valoracion::where('id_usuario', $usuario->getKey())->update(['comentario' => null]);
                $usuario->forceFill([
                    'nombre' => 'Cliente eliminado',
                    'telefono' => null,
                    'correo' => 'eliminado-'.$usuario->getKey().'@eliminado.invalid',
                    'password_hash' => null,
                    'terminos_version' => null,
                    'terminos_aceptados_en' => null,
                ])->save();
            } else {
                $usuario->delete();
            }
        });

        return response()->noContent();
    }

    private function exigirPassword(Usuario $usuario, string $clave, string $campo): void
    {
        if (! $usuario->password_hash || ! Hash::check($clave, $usuario->password_hash)) {
            throw ValidationException::withMessages([$campo => 'La contraseña no es correcta.']);
        }
    }
}
