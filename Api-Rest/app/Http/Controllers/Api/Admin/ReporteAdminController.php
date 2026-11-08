<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reporte;
use App\Support\ReporteFormato;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Reportes de problemas que llegan desde la app, vistos y respondidos desde el panel. */
class ReporteAdminController extends Controller
{
    private const RELACIONES = ['usuario', 'pedido.zona', 'pedido.detalles.tarifa'];

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'estado' => ['sometimes', 'nullable', Rule::in(Reporte::ESTADOS)],
            'buscar' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        // Primero lo que necesita atención; dentro de cada estado, lo más reciente arriba.
        $consulta = Reporte::with(self::RELACIONES)
            ->orderByRaw("CASE estado WHEN 'Recibido' THEN 0 WHEN 'En revisión' THEN 1 ELSE 2 END")
            ->orderByDesc('fecha_creacion')->orderByDesc('id_reporte');

        if (! empty($filtros['estado'])) {
            $consulta->where('estado', $filtros['estado']);
        }
        if (! empty($filtros['buscar'])) {
            $texto = trim($filtros['buscar']);
            if (preg_match('/^r-?(\d+)$/i', $texto, $m)) {
                $consulta->where('id_reporte', (int) $m[1]);        // "R-0004"
            } elseif (preg_match('/^#(\d+)$/', $texto, $m)) {
                $consulta->where('id_pedido', (int) $m[1]);         // "#0004" = número de pedido
            } else {
                $like = '%'.Str::replace(['%', '_'], ['\%', '\_'], $texto).'%';
                $consulta->whereHas('usuario', fn ($usuario) => $usuario->where('nombre', 'like', $like)->orWhere('correo', 'like', $like));
            }
        }

        return response()->json($consulta->limit(500)->get()->map(fn (Reporte $reporte) => ReporteFormato::de($reporte))->values());
    }

    /** Cambia el estado y/o escribe la respuesta que verá el cliente en la app. Un reporte resuelto ya no se edita. */
    public function update(Request $request, Reporte $reporte): JsonResponse
    {
        if ($reporte->estado === 'Resuelto') {
            throw ValidationException::withMessages([
                'estado' => 'Este reporte ya está resuelto y no se puede cambiar.',
            ]);
        }

        $datos = $request->validate([
            'estado' => ['sometimes', 'required', Rule::in(Reporte::ESTADOS)],
            'respuesta' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        if (array_key_exists('respuesta', $datos)) {
            $texto = trim((string) $datos['respuesta']);
            $datos['respuesta'] = $texto === '' ? null : $texto;
        }

        $estado = $datos['estado'] ?? $reporte->estado;
        $respuesta = array_key_exists('respuesta', $datos) ? $datos['respuesta'] : $reporte->respuesta;
        if ($estado === 'Resuelto' && ! $respuesta) {
            throw ValidationException::withMessages([
                'respuesta' => 'Escribe una respuesta para el cliente antes de marcar el reporte como resuelto.',
            ]);
        }

        $reporte->update($datos);

        return response()->json(ReporteFormato::de($reporte->load(self::RELACIONES)));
    }
}
