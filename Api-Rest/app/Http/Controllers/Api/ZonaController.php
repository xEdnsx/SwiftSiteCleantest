<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ZonaCobertura;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ZonaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'activo' => ['sometimes', 'boolean'],
        ]);

        $query = ZonaCobertura::query();
        if (array_key_exists('activo', $filters)) {
            $query->where('activo', $filters['activo']);
        }

        return response()->json($query->orderBy('nombre')->orderBy('id_zona')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $zona = ZonaCobertura::create($data);

        return response()->json($zona->refresh(), 201);
    }

    public function show(ZonaCobertura $zona): JsonResponse
    {
        return response()->json($zona);
    }

    public function update(Request $request, ZonaCobertura $zona): JsonResponse
    {
        $data = $request->validate($this->rules($zona));
        $zona->update($data);

        return response()->json($zona->refresh());
    }

    public function destroy(ZonaCobertura $zona): JsonResponse|Response
    {
        if ($zona->pedidos()->exists()) {
            return response()->json(['message' => 'El registro tiene relaciones asociadas. Puede desactivarlo con activo=false.'], 409);
        }

        $zona->delete();

        return response()->noContent();
    }

    private function rules(?ZonaCobertura $zona = null): array
    {
        $required = $zona === null ? 'required' : 'sometimes';

        return [
            'nombre' => [$required, 'required', 'string', 'max:100', Rule::unique('zonas_cobertura', 'nombre')->ignore($zona?->getKey(), 'id_zona')],
            'recargo' => ['sometimes', 'required', 'numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }
}
