<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Services\Cotizador;
use App\Support\PedidoFormato;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Pedidos de la persona autenticada (app del cliente). */
class PedidoController extends Controller
{
    public function store(Request $request, Cotizador $cotizador): JsonResponse
    {
        $data = $request->validate(Cotizador::reglas() + [
            'direccion' => ['required', 'string', 'min:10', 'max:250'],
            'fecha_servicio' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'franja_horaria' => ['required', 'string', 'min:3', 'max:60'],
            'id_usuario' => ['prohibited'],
            'estado' => ['prohibited'],
        ]);

        // Los montos se calculan aquí con los precios vigentes; lo que mande el cliente no cuenta.
        $cotizacion = $cotizador->calcular((int) $data['id_zona'], $data['items']);

        $pedido = DB::transaction(function () use ($request, $data, $cotizacion): Pedido {
            $pedido = Pedido::create([
                'id_usuario' => $request->user()->getKey(),
                'id_zona' => $cotizacion['zona']->getKey(),
                'direccion' => trim($data['direccion']),
                'fecha_servicio' => $data['fecha_servicio'],
                'franja_horaria' => trim($data['franja_horaria']),
                'fecha_creacion' => now(),
                'estado' => 'Cotizado',
                'subtotal' => $cotizacion['subtotal'],
                'recargo_zona' => $cotizacion['recargo_zona'],
                'total' => $cotizacion['total'],
            ]);
            // Se guarda el precio de ese momento: si el catálogo cambia después, el pedido no se altera.
            $pedido->detalles()->createMany(array_map(fn (array $linea) => [
                'id_tarifa' => $linea['id_tarifa'],
                'cantidad' => $linea['cantidad'],
                'precio_unitario' => $linea['precio_unitario'],
                'subtotal' => $linea['subtotal'],
            ], $cotizacion['items']));

            return $pedido;
        });

        return response()->json(PedidoFormato::de($pedido->load(['zona', 'detalles.tarifa'])), 201);
    }

    public function index(Request $request): JsonResponse
    {
        $pedidos = Pedido::with(['zona', 'detalles.tarifa', 'valoracion', 'reportes'])
            ->where('id_usuario', $request->user()->getKey())
            ->orderByDesc('fecha_creacion')->orderByDesc('id_pedido')
            ->get();

        return response()->json($pedidos->map(fn (Pedido $pedido) => PedidoFormato::de($pedido))->values());
    }

    public function show(Request $request, Pedido $pedido): JsonResponse
    {
        // Un pedido ajeno se comporta como si no existiera.
        abort_unless($pedido->id_usuario === $request->user()->getKey(), 404);

        return response()->json(PedidoFormato::de($pedido->load(['zona', 'detalles.tarifa', 'valoracion', 'reportes'])));
    }
}
