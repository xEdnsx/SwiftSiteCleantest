<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TarifaItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TarifaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'activo' => ['sometimes', 'boolean'],
            'id_categoria' => ['sometimes', 'integer', 'exists:categorias_servicio,id_categoria'],
        ]);

        $query = TarifaItem::query();
        if (array_key_exists('activo', $filters)) {
            $query->where('activo', $filters['activo']);
        }
        if (isset($filters['id_categoria'])) {
            $query->where('id_categoria', $filters['id_categoria']);
        }

        return response()->json($query->orderBy('tipo_item')->orderBy('id_tarifa')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $tarifa = TarifaItem::create($data);

        return response()->json($tarifa->refresh(), 201);
    }

    public function show(TarifaItem $tarifa): JsonResponse
    {
        return response()->json($tarifa);
    }

    public function update(Request $request, TarifaItem $tarifa): JsonResponse
    {
        $data = $request->validate($this->rules($tarifa));
        $tarifa->update($data);

        return response()->json($tarifa->refresh());
    }

    public function destroy(TarifaItem $tarifa): JsonResponse|Response
    {
        if ($tarifa->detalles()->exists()) {
            return response()->json(['message' => 'El registro tiene relaciones asociadas. Puede desactivarlo con activo=false.'], 409);
        }

        $tarifa->delete();

        return response()->noContent();
    }

    private function rules(?TarifaItem $tarifa = null): array
    {
        $required = $tarifa === null ? 'required' : 'sometimes';

        return [
            'id_categoria' => [$required, 'required', 'integer', 'exists:categorias_servicio,id_categoria'],
            'tipo_item' => [$required, 'required', 'string', 'max:100'],
            'material' => ['sometimes', 'nullable', 'string', 'max:80'],
            'precio_unitario' => [$required, 'required', 'numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }
}
