<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Valoracion;
use App\Support\ValoracionFormato;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Moderación de valoraciones desde el panel: solo se publican las que el administrador aprueba. */
class ValoracionAdminController extends Controller
{
    private const RELACIONES = ['usuario', 'pedido.zona', 'pedido.detalles.tarifa'];

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate(['estado' => ['sometimes', 'nullable', Rule::in(Valoracion::ESTADOS)]]);

        $consulta = Valoracion::with(self::RELACIONES)
            ->orderByRaw("CASE estado WHEN 'Pendiente' THEN 0 WHEN 'Publicada' THEN 1 ELSE 2 END")
            ->orderByDesc('fecha_creacion')->orderByDesc('id_valoracion');

        if (! empty($filtros['estado'])) {
            $consulta->where('estado', $filtros['estado']);
        }

        return response()->json($consulta->limit(500)->get()->map(fn (Valoracion $valoracion) => ValoracionFormato::de($valoracion))->values());
    }

    public function update(Request $request, Valoracion $valoracion): JsonResponse
    {
        $datos = $request->validate(['estado' => ['required', Rule::in(Valoracion::ESTADOS)]]);

        // La app muestra pocas opiniones a la vez: para mostrar otra hay que ocultar una.
        if ($datos['estado'] === 'Publicada' && $valoracion->estado !== 'Publicada'
            && Valoracion::where('estado', 'Publicada')->count() >= Valoracion::MAXIMO_EN_APP) {
            throw ValidationException::withMessages([
                'estado' => 'Ya hay '.Valoracion::MAXIMO_EN_APP.' valoraciones en la app. Oculta una para mostrar otra.',
            ]);
        }

        $valoracion->update($datos);

        return response()->json(ValoracionFormato::de($valoracion->load(self::RELACIONES)));
    }

    public function destroy(Valoracion $valoracion): Response
    {
        $valoracion->delete();

        return response()->noContent();
    }
}
