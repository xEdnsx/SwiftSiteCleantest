<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Cotizador;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CotizacionController extends Controller
{
    public function store(Request $request, Cotizador $cotizador): JsonResponse
    {
        $data = $request->validate(Cotizador::reglas());
        $cotizacion = $cotizador->calcular((int) $data['id_zona'], $data['items']);

        return response()->json([
            'preliminar' => true,
            'id_zona' => $cotizacion['zona']->getKey(),
            'items' => $cotizacion['items'],
            'subtotal' => $cotizacion['subtotal'],
            'recargo_zona' => $cotizacion['recargo_zona'],
            'total' => $cotizacion['total'],
        ]);
    }
}
