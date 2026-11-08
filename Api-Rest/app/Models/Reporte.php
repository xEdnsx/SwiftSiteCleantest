<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reporte extends Model
{
    public const MOTIVOS = [
        'Limpieza incompleta',
        'Daño en mi pertenencia',
        'Llegaron tarde',
        'Cobro incorrecto',
        'Trato del personal',
        'Otro',
    ];

    public const ESTADOS = ['Recibido', 'En revisión', 'Resuelto'];

    public const CREATED_AT = 'fecha_creacion';

    public const UPDATED_AT = 'fecha_actualizacion';

    protected $table = 'reportes';

    protected $primaryKey = 'id_reporte';

    protected $fillable = ['id_pedido', 'id_usuario', 'motivo', 'descripcion', 'estado', 'respuesta'];

    protected function casts(): array
    {
        return [
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
