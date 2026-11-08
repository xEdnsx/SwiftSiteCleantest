<?php

namespace App\Support;

use App\Models\Reporte;

/** Forma única en que la API entrega un reporte. */
final class ReporteFormato
{
    /** @return array<string, mixed> */
    public static function de(Reporte $reporte): array
    {
        $datos = [
            'id_reporte' => $reporte->getKey(),
            'id_pedido' => $reporte->id_pedido,
            'motivo' => $reporte->motivo,
            'descripcion' => $reporte->descripcion,
            'estado' => $reporte->estado,
            'respuesta' => $reporte->respuesta,
            'fecha_creacion' => $reporte->fecha_creacion?->toIso8601String(),
            'fecha_actualizacion' => $reporte->fecha_actualizacion?->toIso8601String(),
        ];

        // Solo el panel carga estas relaciones.
        if ($reporte->relationLoaded('usuario')) {
            $datos['usuario'] = $reporte->usuario
                ? ['id_usuario' => $reporte->usuario->getKey(), 'nombre' => $reporte->usuario->nombre, 'correo' => $reporte->usuario->correo, 'telefono' => $reporte->usuario->telefono]
                : null;
        }
        if ($reporte->relationLoaded('pedido')) {
            $datos['pedido'] = $reporte->pedido ? PedidoFormato::de($reporte->pedido) : null;
        }

        return $datos;
    }
}
