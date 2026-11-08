<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Usuario;
use App\Support\PedidoFormato;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Clientes vistos desde el panel administrativo.
 * Solo toca usuarios con rol Cliente; nunca expone ni acepta contraseñas.
 */
class ClienteAdminController extends Controller
{
    private const ROL = 'Cliente';

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate(['buscar' => ['sometimes', 'nullable', 'string', 'max:100']]);

        $consulta = $this->clientes()->orderByDesc('id_usuario');

        if (! empty($filtros['buscar'])) {
            $texto = '%'.Str::replace(['%', '_'], ['\%', '\_'], trim($filtros['buscar'])).'%';
            $consulta->where(fn ($query) => $query
                ->where('nombre', 'like', $texto)
                ->orWhere('correo', 'like', $texto)
                ->orWhere('telefono', 'like', $texto));
        }

        return response()->json(
            $consulta->limit(500)->get()->map(fn (Usuario $cliente) => $this->formato($cliente))->values()
        );
    }

    /** Perfil: datos, métricas e historial de pedidos. */
    public function show(Usuario $cliente): JsonResponse
    {
        $cliente = $this->clientes()->findOrFail($cliente->getKey());
        $pedidos = $cliente->pedidos()
            ->with(['zona', 'detalles.tarifa'])
            ->orderByDesc('fecha_creacion')->orderByDesc('id_pedido')
            ->limit(200)->get();

        return response()->json($this->formato($cliente) + [
            'pedidos' => $pedidos->map(fn ($pedido) => PedidoFormato::de($pedido))->values()->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate(
            $this->reglas() + ['password' => ['prohibited'], 'id_rol' => ['prohibited']]
        );

        $this->exigirContacto($datos['telefono'] ?? null, $datos['correo'] ?? null);

        $cliente = Usuario::create($datos + ['id_rol' => $this->rolCliente()->getKey()]);

        return response()->json($this->formato($this->clientes()->findOrFail($cliente->getKey())), 201);
    }

    public function update(Request $request, Usuario $cliente): JsonResponse
    {
        $cliente = $this->clientes()->findOrFail($cliente->getKey());
        $datos = $request->validate(
            $this->reglas($cliente) + ['password' => ['prohibited'], 'id_rol' => ['prohibited']]
        );

        $telefono = array_key_exists('telefono', $datos) ? $datos['telefono'] : $cliente->telefono;
        $correo = array_key_exists('correo', $datos) ? $datos['correo'] : $cliente->correo;
        $this->exigirContacto($telefono, $correo);
        if ($correo === null && $cliente->password_hash !== null) {
            throw ValidationException::withMessages([
                'correo' => 'Este cliente ya tiene cuenta en la app: su correo es con el que entra, no se puede quitar.',
            ]);
        }

        $cliente->update($datos);

        return response()->json($this->formato($this->clientes()->findOrFail($cliente->getKey())));
    }

    /** Un cliente con pedidos no se borra: se perdería su historial. */
    public function destroy(Usuario $cliente): JsonResponse
    {
        $cliente = $this->clientes()->findOrFail($cliente->getKey());

        if ($cliente->pedidos()->exists()) {
            return response()->json([
                'message' => 'Este cliente tiene pedidos y no se puede eliminar para conservar su historial.',
            ], 409);
        }

        $cliente->tokens()->delete();
        $cliente->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, array<int, mixed>> */
    private function reglas(?Usuario $cliente = null): array
    {
        $obligatorio = $cliente ? 'sometimes' : 'required';

        return [
            'nombre' => [$obligatorio, 'string', 'min:2', 'max:120'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:25', 'regex:/^[0-9+\-\s()]{7,25}$/'],
            // El correo es opcional: hay clientes que solo tienen teléfono (ver exigirContacto).
            'correo' => [
                'sometimes', 'nullable', 'string', 'email:rfc', 'max:150',
                Rule::unique('usuarios', 'correo')->ignore($cliente?->getKey(), 'id_usuario'),
            ],
        ];
    }

    /** Sin teléfono ni correo no hay cómo contactar al cliente. */
    private function exigirContacto(?string $telefono, ?string $correo): void
    {
        if (trim((string) $telefono) === '' && trim((string) $correo) === '') {
            throw ValidationException::withMessages([
                'correo' => 'Escribe al menos un teléfono o un correo para poder contactar al cliente.',
            ]);
        }
    }

    private function rolCliente(): Rol
    {
        return Rol::firstOrCreate(['nombre_rol' => self::ROL]);
    }

    /** Consulta base: solo clientes, con sus métricas ya calculadas. */
    private function clientes()
    {
        return Usuario::query()
            ->whereHas('rol', fn ($rol) => $rol->where('nombre_rol', self::ROL))
            ->withCount([
                'pedidos',
                'pedidos as servicios_finalizados' => fn ($pedido) => $pedido->where('estado', 'Finalizado'),
            ])
            ->withSum(['pedidos as total_gastado' => fn ($pedido) => $pedido->where('estado', 'Finalizado')], 'total')
            ->withMax('pedidos as ultimo_pedido', 'fecha_creacion');
    }

    /** @return array<string, mixed> */
    private function formato(Usuario $cliente): array
    {
        return [
            'id_usuario' => $cliente->getKey(),
            'nombre' => $cliente->nombre,
            'telefono' => $cliente->telefono,
            'correo' => $cliente->correo,
            'tiene_acceso' => $cliente->password_hash !== null,
            'pedidos_count' => (int) $cliente->pedidos_count,
            'servicios_finalizados' => (int) $cliente->servicios_finalizados,
            'total_gastado' => number_format((float) $cliente->total_gastado, 2, '.', ''),
            'ultimo_pedido' => $cliente->ultimo_pedido
                ? Carbon::parse($cliente->ultimo_pedido, 'UTC')->toIso8601String()
                : null,
        ];
    }
}
