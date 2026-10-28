<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ZonaCobertura extends Model
{
    protected $table = 'zonas_cobertura';

    protected $primaryKey = 'id_zona';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'recargo',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'recargo' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'id_zona', 'id_zona');
    }
}
