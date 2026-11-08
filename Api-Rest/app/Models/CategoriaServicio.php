<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoriaServicio extends Model
{
    protected $table = 'categorias_servicio';

    protected $primaryKey = 'id_categoria';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'icono',
        'pregunta_tipo',
        'pregunta_variante',
        'pregunta_cantidad',
        'unidad',
        'nota',
        'cantidad_max',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'cantidad_max' => 'integer',
        ];
    }

    public function tarifas(): HasMany
    {
        return $this->hasMany(
            TarifaItem::class,
            'id_categoria',
            'id_categoria'
        );
    }
}
