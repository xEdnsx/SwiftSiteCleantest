<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TarifaItem extends Model
{
    protected $table = 'tarifas_items';

    protected $primaryKey = 'id_tarifa';

    public $timestamps = false;

    protected $fillable = [
        'id_categoria',
        'tipo_item',
        'material',
        'precio_unitario',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio_unitario' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(CategoriaServicio::class, 'id_categoria', 'id_categoria');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetallePedido::class, 'id_tarifa', 'id_tarifa');
    }
}
