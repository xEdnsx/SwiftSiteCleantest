<?php

namespace App\Support;

use App\Models\Valoracion;

/** Forma única en que la API entrega una valoración. */
final class ValoracionFormato
{
    /** @return array<string, mixed> */
    public static function de(Valoracion $valoracion): array
    {
        $datos = [
            'id_valoracion' => $valoracion->getKey(),
            'id_pedido' => $valoracion->id_pedido,
            'estrellas' => $valoracion->estrellas,
            'aspectos' => $valoracion->aspectos ?? [],
            'comentario' => $valoracion->comentario,
            'estado' => $valoracion->estado,
            'fecha_creacion' => $valoracion->fecha_creacion?->toIso8601String(),
        ];

        if ($valoracion->relationLoaded('usuario')) {
            $datos['usuario'] = $valoracion->usuario
                ? ['id_usuario' => $valoracion->usuario->getKey(), 'nombre' => $valoracion->usuario->nombre, 'correo' => $valoracion->usuario->correo]
                : null;
        }
        if ($valoracion->relationLoaded('pedido')) {
            $datos['pedido'] = $valoracion->pedido ? PedidoFormato::de($valoracion->pedido) : null;
        }

        return $datos;
    }

    /**
     * Lo único que ve el público de una valoración publicada: sin correo, ids ni pedido.
     *
     * @return array<string, mixed>
     */
    public static function publica(Valoracion $valoracion): array
    {
        return [
            'id_valoracion' => $valoracion->getKey(),
            'estrellas' => $valoracion->estrellas,
            'aspectos' => $valoracion->aspectos ?? [],
            'comentario' => $valoracion->comentario,
            'nombre' => self::nombreAbreviado($valoracion->usuario?->nombre),
            'fecha' => $valoracion->fecha_creacion?->toIso8601String(),
        ];
    }

    /** «Ana Martínez López» → «Ana M.»; sin nombre → «Cliente». */
    public static function nombreAbreviado(?string $nombre): string
    {
        $partes = preg_split('/\s+/u', trim((string) $nombre), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if ($partes === []) {
            return 'Cliente';
        }
        // Quien escribió su nombre todo en minúsculas ("ana") se muestra con mayúscula inicial.
        $primero = $partes[0] === mb_strtolower($partes[0]) ? mb_convert_case($partes[0], MB_CASE_TITLE) : $partes[0];
        if (count($partes) === 1) {
            return $primero;
        }

        return $primero.' '.mb_strtoupper(mb_substr($partes[1], 0, 1)).'.';
    }
}
