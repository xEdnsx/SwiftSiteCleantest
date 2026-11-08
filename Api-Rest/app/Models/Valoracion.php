<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Valoracion extends Model
{
    public const ASPECTOS = ['Puntualidad', 'Limpieza', 'Buen trato', 'Precio justo'];

    public const ESTADOS = ['Pendiente', 'Publicada', 'Oculta'];

    /** Cuántas valoraciones puede mostrar la app a la vez (las que el administrador marca como Publicada). */
    public const MAXIMO_EN_APP = 5;

    public const CREATED_AT = 'fecha_creacion';

    public const UPDATED_AT = 'fecha_actualizacion';

    protected $table = 'valoraciones';

    protected $primaryKey = 'id_valoracion';

    protected $fillable = ['id_pedido', 'id_usuario', 'estrellas', 'aspectos', 'comentario', 'estado'];

    protected function casts(): array
    {
        return [
            'estrellas' => 'integer',
            'aspectos' => 'array',
            'fecha_creacion' => 'datetime',
            'fecha_actualizacion' => 'datetime',
        ];
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'id_pedido', 'id_pedido');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}
