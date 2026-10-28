<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TarifaItem;
use App\Models\ZonaCobertura;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CotizacionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_zona' => ['required', 'integer', 'exists:zonas_cobertura,id_zona'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*' => ['required', 'array:id_tarifa,cantidad'],
            'items.*.id_tarifa' => ['required', 'integer', 'distinct', 'exists:tarifas_items,id_tarifa'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:10000'],
            'subtotal' => ['prohibited'],
            'total' => ['prohibited'],
            'recargo_zona' => ['prohibited'],
        ]);

        $zona = ZonaCobertura::whereKey($data['id_zona'])->where('activo', true)->first();
        if (! $zona) {
            throw ValidationException::withMessages(['id_zona' => 'La zona no esta disponible.']);
        }
        $tarifas = TarifaItem::whereIn('id_tarifa', array_column($data['items'], 'id_tarifa'))
            ->where('activo', true)->whereHas('categoria', fn ($query) => $query->where('activo', true))
            ->get()->keyBy('id_tarifa');
        $subtotal = 0;
        $items = [];
        foreach ($data['items'] as $index => $item) {
            $tarifa = $tarifas->get($item['id_tarifa']);
            if (! $tarifa) {
                throw ValidationException::withMessages(["items.$index.id_tarifa" => 'La tarifa o su categoria no esta disponible.']);
            }
            $importe = $this->cents($tarifa->precio_unitario) * (int) $item['cantidad'];
            $subtotal += $importe;
            $items[] = [
                'id_tarifa' => $tarifa->getKey(),
                'tipo_item' => $tarifa->tipo_item,
                'cantidad' => (int) $item['cantidad'],
                'precio_unitario' => $tarifa->precio_unitario,
                'subtotal' => $this->money($importe),
            ];
        }
        $recargo = $this->cents($zona->recargo);
        if ($subtotal + $recargo > 9999999999) {
            throw ValidationException::withMessages(['items' => 'El total excede el importe permitido.']);
        }

        return response()->json([
            'preliminar' => true,
            'id_zona' => $zona->getKey(),
            'items' => $items,
            'subtotal' => $this->money($subtotal),
            'recargo_zona' => $this->money($recargo),
            'total' => $this->money($subtotal + $recargo),
        ]);
    }

    private function cents(string $value): int
    {
        [$whole, $fraction] = explode('.', $value);

        return (int) $whole * 100 + (int) $fraction;
    }

    private function money(int $cents): string
    {
        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
