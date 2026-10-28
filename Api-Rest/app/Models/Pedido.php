<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pedido extends Model
{
    protected $table = 'pedidos';

    protected $primaryKey = 'id_pedido';

    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'id_zona',
        'direccion',
        'fecha_servicio',
        'franja_horaria',
        'fecha_creacion',
        'estado',
        'subtotal',
        'recargo_zona',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'fecha_servicio' => 'date',
            'fecha_creacion' => 'datetime',
            'subtotal' => 'decimal:2',
            'recargo_zona' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    public function zona(): BelongsTo
    {
        return $this->belongsTo(ZonaCobertura::class, 'id_zona', 'id_zona');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetallePedido::class, 'id_pedido', 'id_pedido');
    }
}
