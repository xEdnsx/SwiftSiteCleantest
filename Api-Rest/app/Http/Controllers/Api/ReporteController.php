<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Reporte;
use App\Support\ReporteFormato;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Reportes de problemas que hace la persona autenticada sobre sus pedidos finalizados. */
class ReporteController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'id_pedido' => ['required', 'integer'],
            'motivo' => ['required', 'string', Rule::in(Reporte::MOTIVOS)],
            'descripcion' => ['required', 'string', 'min:10', 'max:500'],
            'id_usuario' => ['prohibited'],
            'estado' => ['prohibited'],
            'respuesta' => ['prohibited'],
        ]);

        $pedido = Pedido::find($datos['id_pedido']);
        // Un pedido ajeno se comporta como si no existiera.
        abort_unless($pedido && $pedido->id_usuario === $request->user()->getKey(), 404);

        if ($pedido->estado !== 'Finalizado') {
            return response()->json(['message' => 'Solo puedes reportar un problema de un pedido finalizado.'], 422);
        }

        $abierto = Reporte::where('id_pedido', $pedido->getKey())->where('estado', '!=', 'Resuelto')->exists();
        if ($abierto) {
            return response()->json(['message' => 'Ya enviaste un reporte de este pedido y lo estamos revisando.'], 422);
        }

        $reporte = Reporte::create([
            'id_pedido' => $pedido->getKey(),
            'id_usuario' => $request->user()->getKey(),
            'motivo' => $datos['motivo'],
            'descripcion' => trim($datos['descripcion']),
            'estado' => 'Recibido',
        ]);

        return response()->json(ReporteFormato::de($reporte->refresh()), 201);
    }

    public function index(Request $request): JsonResponse
    {
        $reportes = Reporte::where('id_usuario', $request->user()->getKey())
            ->orderByDesc('fecha_creacion')->orderByDesc('id_reporte')
            ->get();

        return response()->json($reportes->map(fn (Reporte $reporte) => ReporteFormato::de($reporte))->values());
    }
}
