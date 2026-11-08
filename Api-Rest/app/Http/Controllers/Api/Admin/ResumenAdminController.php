<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Support\PedidoFormato;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Números del Inicio del panel. */
class ResumenAdminController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // "Hoy" lo manda el panel con su fecha local: el servidor trabaja en UTC y de noche
        // (después de las 6 p. m. en El Salvador) ya estaría en el día siguiente.
        $datos = $request->validate(['fecha' => ['required', 'date_format:Y-m-d']]);
        $hoy = Carbon::createFromFormat('Y-m-d', $datos['fecha'])->startOfDay();
        $relaciones = ['usuario', 'zona', 'detalles.tarifa'];

        $ingresos = Pedido::where('estado', 'Finalizado')
            ->whereBetween('fecha_servicio', [$hoy->copy()->startOfMonth()->toDateString(), $hoy->copy()->endOfMonth()->toDateString()])
            ->sum('total');

        return response()->json([
            'fecha' => $hoy->toDateString(),
            'pedidos_hoy' => Pedido::whereDate('fecha_servicio', $hoy->toDateString())->count(),
            'por_confirmar' => Pedido::where('estado', 'Cotizado')->count(),
            'ingresos_mes' => number_format((float) $ingresos, 2, '.', ''),
            'clientes' => Usuario::whereHas('rol', fn ($rol) => $rol->where('nombre_rol', 'Cliente'))->count(),
            'recientes' => Pedido::with($relaciones)->orderByDesc('fecha_creacion')->orderByDesc('id_pedido')->limit(5)->get()
                ->map(fn (Pedido $pedido) => PedidoFormato::de($pedido))->values(),
            'agenda_hoy' => Pedido::with($relaciones)->whereDate('fecha_servicio', $hoy->toDateString())->orderBy('id_pedido')->get()
                ->map(fn (Pedido $pedido) => PedidoFormato::de($pedido))->values(),
        ]);
    }
}
