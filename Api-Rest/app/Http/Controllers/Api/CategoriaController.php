<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategoriaServicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'activo' => ['sometimes', 'boolean'],
        ]);

        $query = CategoriaServicio::query();
        if (array_key_exists('activo', $filters)) {
            $query->where('activo', $filters['activo']);
        }

        return response()->json($query->orderBy('nombre')->orderBy('id_categoria')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $categoria = CategoriaServicio::create($data);

        return response()->json($categoria->refresh(), 201);
    }

    public function show(CategoriaServicio $categoria): JsonResponse
    {
        return response()->json($categoria);
    }

    public function update(Request $request, CategoriaServicio $categoria): JsonResponse
    {
        $data = $request->validate($this->rules($categoria));
        $categoria->update($data);

        return response()->json($categoria->refresh());
    }

    public function destroy(CategoriaServicio $categoria): JsonResponse|Response
    {
        if ($categoria->tarifas()->exists()) {
            return response()->json(['message' => 'El registro tiene relaciones asociadas. Puede desactivarlo con activo=false.'], 409);
        }

        $categoria->delete();

        return response()->noContent();
    }

    private function rules(?CategoriaServicio $categoria = null): array
    {
        $required = $categoria === null ? 'required' : 'sometimes';

        return [
            'nombre' => [$required, 'required', 'string', 'max:80', Rule::unique('categorias_servicio', 'nombre')->ignore($categoria?->getKey(), 'id_categoria')],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:300'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }
}
