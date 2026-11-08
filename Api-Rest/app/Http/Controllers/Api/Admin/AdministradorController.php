<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\Request;

class AdministradorController extends Controller
{
    public function index()
    {
        return response()->json(Usuario::whereHas('rol', fn ($q) => $q->where('nombre_rol', 'Administrador'))->orderBy('id_usuario')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'correo' => ['required', 'email', 'max:150', 'unique:usuarios,correo'],
            'telefono' => ['nullable', 'string', 'max:25'],
            'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed'],
            'id_rol' => ['prohibited'], 'id_usuario' => ['prohibited'], 'password_hash' => ['prohibited'],
        ]);
        $user = Usuario::create(['nombre' => $data['nombre'], 'correo' => $data['correo'], 'telefono' => $data['telefono'] ?? null, 'password_hash' => $data['password'], 'id_rol' => Rol::firstOrCreate(['nombre_rol' => 'Administrador'])->getKey()]);

        return response()->json($user->load('rol'), 201);
    }
}
