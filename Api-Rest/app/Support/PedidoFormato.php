<?php

namespace App\Support;

use App\Models\Pedido;

/** Forma única en que la API entrega un pedido (cliente y admin ven lo mismo). */
final class PedidoFormato
{
    /** @return array<string, mixed> */
    public static function de(Pedido $pedido): array
    {
        $datos = [
            'id_pedido' => $pedido->getKey(),
            'estado' => $pedido->estado,
            'fecha_servicio' => $pedido->fecha_servicio?->toDateString(),
            'franja_horaria' => $pedido->franja_horaria,
            'fecha_creacion' => $pedido->fecha_creacion?->toIso8601String(),
            'direccion' => $pedido->direccion,
            'subtotal' => $pedido->subtotal,
            'recargo_zona' => $pedido->recargo_zona,
            'total' => $pedido->total,
            'zona' => $pedido->relationLoaded('zona') && $pedido->zona
                ? ['id_zona' => $pedido->zona->getKey(), 'nombre' => $pedido->zona->nombre]
                : null,
            'lineas' => $pedido->relationLoaded('detalles')
                ? $pedido->detalles->map(fn ($detalle) => [
                    'id_detalle' => $detalle->getKey(),
                    'id_tarifa' => $detalle->id_tarifa,
                    'tipo_item' => $detalle->tarifa?->tipo_item,
                    'material' => $detalle->tarifa?->material,
                    'cantidad' => $detalle->cantidad,
                    'precio_unitario' => $detalle->precio_unitario,
                    'subtotal' => $detalle->subtotal,
                ])->values()->all()
                : [],
        ];

        if ($pedido->relationLoaded('usuario')) {
            $datos['usuario'] = $pedido->usuario
                ? [
                    'id_usuario' => $pedido->usuario->getKey(),
                    'nombre' => $pedido->usuario->nombre,
                    'correo' => $pedido->usuario->correo,
                    'telefono' => $pedido->usuario->telefono,
                ]
                : null;
        }

        // Solo se incluyen cuando la consulta los cargó (el panel y "Mis pedidos").
        if ($pedido->relationLoaded('reportes')) {
            $datos['reportes'] = $pedido->reportes->map(fn ($reporte) => [
                'id_reporte' => $reporte->getKey(),
                'motivo' => $reporte->motivo,
                'estado' => $reporte->estado,
            ])->values()->all();
        }
        if ($pedido->relationLoaded('valoracion')) {
            $datos['valoracion'] = $pedido->valoracion
                ? ['id_valoracion' => $pedido->valoracion->getKey(), 'estrellas' => $pedido->valoracion->estrellas, 'estado' => $pedido->valoracion->estado]
                : null;
        }

        return $datos;
    }
}
