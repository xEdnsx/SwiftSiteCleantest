<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Reporte;
use App\Models\Valoracion;
use Illuminate\Http\JsonResponse;

/** Lo que espera atención del equipo: se muestra como contadores en el menú del panel. */
class PendientesAdminController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'pedidos_por_confirmar' => Pedido::where('estado', 'Cotizado')->count(),
            'reportes_abiertos' => Reporte::where('estado', '!=', 'Resuelto')->count(),
            'valoraciones_pendientes' => Valoracion::where('estado', 'Pendiente')->count(),
        ]);
    }
}
