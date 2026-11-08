<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Valoracion;
use App\Support\ValoracionFormato;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Valoraciones que hace la persona autenticada sobre sus pedidos finalizados. */
class ValoracionController extends Controller
{
    private const YA_VALORADO = 'Ya valoraste este pedido.';

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'id_pedido' => ['required', 'integer'],
            'estrellas' => ['required', 'integer', 'between:1,5'],
            'aspectos' => ['sometimes', 'nullable', 'array', 'max:'.count(Valoracion::ASPECTOS)],
            'aspectos.*' => ['string', 'distinct', Rule::in(Valoracion::ASPECTOS)],
            'comentario' => ['sometimes', 'nullable', 'string', 'max:500'],
            'id_usuario' => ['prohibited'],
            'estado' => ['prohibited'],
        ]);

        $pedido = Pedido::find($datos['id_pedido']);
        // Un pedido ajeno se comporta como si no existiera.
        abort_unless($pedido && $pedido->id_usuario === $request->user()->getKey(), 404);

        if ($pedido->estado !== 'Finalizado') {
            return response()->json(['message' => 'Solo puedes valorar un pedido finalizado.'], 422);
        }
        if (Valoracion::where('id_pedido', $pedido->getKey())->exists()) {
            return response()->json(['message' => self::YA_VALORADO], 422);
        }

        $comentario = isset($datos['comentario']) ? trim($datos['comentario']) : '';

        try {
            $valoracion = Valoracion::create([
                'id_pedido' => $pedido->getKey(),
                'id_usuario' => $request->user()->getKey(),
                'estrellas' => $datos['estrellas'],
                'aspectos' => array_values($datos['aspectos'] ?? []),
                'comentario' => $comentario === '' ? null : $comentario,
                'estado' => 'Pendiente',
            ]);
        } catch (UniqueConstraintViolationException) {
            // Dos envíos a la vez: gana el primero.
            return response()->json(['message' => self::YA_VALORADO], 422);
        }

        return response()->json(ValoracionFormato::de($valoracion->refresh()), 201);
    }

    /** Valoraciones que el administrador decidió mostrar (como mucho Valoracion::MAXIMO_EN_APP). Es pública. */
    public function publicas(): JsonResponse
    {
        $valoraciones = Valoracion::with('usuario')
            ->where('estado', 'Publicada')
            ->orderByDesc('fecha_actualizacion')->orderByDesc('id_valoracion')
            ->limit(Valoracion::MAXIMO_EN_APP)
            ->get();

        return response()->json($valoraciones->map(fn (Valoracion $valoracion) => ValoracionFormato::publica($valoracion))->values());
    }

    public function index(Request $request): JsonResponse
    {
        $valoraciones = Valoracion::where('id_usuario', $request->user()->getKey())
            ->orderByDesc('fecha_creacion')->orderByDesc('id_valoracion')
            ->get();

        return response()->json($valoraciones->map(fn (Valoracion $valoracion) => ValoracionFormato::de($valoracion))->values());
    }
}
