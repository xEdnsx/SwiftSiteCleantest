<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'usuarios';

    protected $primaryKey = 'id_usuario';

    public $timestamps = false;

    protected $fillable = [
        'id_rol',
        'nombre',
        'telefono',
        'correo',
        'password_hash',
        'terminos_version',
        'terminos_aceptados_en',
    ];

    protected $hidden = ['password_hash'];

    protected $authPasswordName = 'password_hash';

    protected $rememberTokenName = '';

    protected function casts(): array
    {
        return [
            'password_hash' => 'hashed',
            'terminos_aceptados_en' => 'datetime',
        ];
    }

    public function getEmailForPasswordReset(): string
    {
        return (string) $this->correo;
    }

    public function routeNotificationForMail($notification = null): string
    {
        return (string) $this->correo;
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'id_usuario', 'id_usuario');
    }
}
