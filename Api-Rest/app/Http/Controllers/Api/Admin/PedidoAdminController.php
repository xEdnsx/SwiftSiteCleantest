<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Support\PedidoFormato;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Gestión de pedidos desde el panel administrativo. */
class PedidoAdminController extends Controller
{
    /** Orden del flujo de trabajo. */
    private const ESTADOS = ['Cotizado', 'Confirmado', 'En proceso', 'Finalizado'];

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'estado' => ['sometimes', 'nullable', Rule::in(self::ESTADOS)],
            'buscar' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $consulta = Pedido::with(['usuario', 'zona', 'detalles.tarifa', 'valoracion', 'reportes'])
            ->orderByDesc('fecha_creacion')->orderByDesc('id_pedido');

        if (! empty($filtros['estado'])) {
            $consulta->where('estado', $filtros['estado']);
        }
        if (! empty($filtros['buscar'])) {
            $texto = trim($filtros['buscar']);
            $numero = ltrim($texto, '#');
            $consulta->where(function ($query) use ($texto, $numero) {
                $query->whereHas('usuario', fn ($usuario) => $usuario
                    ->where('nombre', 'like', '%'.Str::replace(['%', '_'], ['\%', '\_'], $texto).'%')
                    ->orWhere('correo', 'like', '%'.Str::replace(['%', '_'], ['\%', '\_'], $texto).'%'));
                if (ctype_digit($numero)) {
                    $query->orWhere('id_pedido', (int) $numero);
                }
            });
        }

        return response()->json(
            $consulta->limit(500)->get()->map(fn (Pedido $pedido) => PedidoFormato::de($pedido))->values()
        );
    }

    public function show(Pedido $pedido): JsonResponse
    {
        return response()->json(PedidoFormato::de($pedido->load(['usuario', 'zona', 'detalles.tarifa', 'valoracion', 'reportes'])));
    }

    /** Cambia el estado un paso a la vez (adelante o atrás), para evitar saltos por error. */
    public function actualizarEstado(Request $request, Pedido $pedido): JsonResponse
    {
        $datos = $request->validate(['estado' => ['required', Rule::in(self::ESTADOS)]]);

        $actual = array_search($pedido->estado, self::ESTADOS, true);
        $nuevo = array_search($datos['estado'], self::ESTADOS, true);
        if ($actual === false || abs($nuevo - $actual) !== 1) {
            throw ValidationException::withMessages([
                'estado' => "No se puede pasar de {$pedido->estado} a {$datos['estado']}. Cambia el estado un paso a la vez.",
            ]);
        }

        $pedido->update(['estado' => $datos['estado']]);

        return response()->json(PedidoFormato::de($pedido->load(['usuario', 'zona', 'detalles.tarifa', 'valoracion', 'reportes'])));
    }
}
