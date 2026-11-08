<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\RecuperarPassword;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordRecoveryController extends Controller
{
    public function solicitar(Request $request)
    {
        $data = $request->validate(['correo' => ['required', 'email', 'max:150']]);
        abort_if(in_array(config('mail.default'), ['log', 'array'], true), 503, 'La recuperacion por correo no esta disponible. Contacta con soporte.');
        DB::transaction(function () use ($data) {
            $user = Usuario::where('correo', $data['correo'])->lockForUpdate()->first();
            // Accounts without a password must complete the existing activation flow.
            if (! $user || ! $user->password_hash) {
                return;
            }
            $record = DB::table('password_reset_tokens')->where('email', $user->correo)->first();
            if ($record && Carbon::parse($record->created_at)->gt(now()->subMinute())) {
                return;
            }
            $code = Str::random(64);
            DB::table('password_reset_tokens')->updateOrInsert(['email' => $user->correo], ['token' => Hash::make($code), 'created_at' => now()]);
            Mail::to($user->correo)->send(new RecuperarPassword($code));
        });

        return response()->json(['message' => 'Si existe una cuenta con acceso, recibiras un codigo por correo. Revisa tambien spam. Puedes reenviarlo despues de un minuto.'])->header('Cache-Control', 'no-store');
    }

    public function restablecer(Request $request)
    {
        $data = $request->validate(['correo' => ['required', 'email', 'max:150'], 'token' => ['required', 'string', 'max:256'], 'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed']]);
        DB::transaction(function () use ($data) {
            $user = Usuario::where('correo', $data['correo'])->lockForUpdate()->first();
            $record = DB::table('password_reset_tokens')->where('email', $data['correo'])->lockForUpdate()->first();
            if (! $user || ! $user->password_hash || ! $record || ! $record->created_at || Carbon::parse($record->created_at)->lte(now()->subMinutes(30)) || ! Hash::check($data['token'], $record->token)) {
                throw ValidationException::withMessages(['token' => 'El codigo no es valido o ha caducado. Solicita uno nuevo.']);
            }
            $user->update(['password_hash' => $data['password']]);
            $user->tokens()->delete();
            DB::table('password_reset_tokens')->where('email', $data['correo'])->delete();
        });

        return response()->json(['message' => 'Contrasena actualizada. Inicia sesion con tu nueva contrasena.'])->header('Cache-Control', 'no-store');
    }
}
