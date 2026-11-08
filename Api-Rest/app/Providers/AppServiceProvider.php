<?php

namespace App\Providers;

use App\Models\Usuario;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('crear-administradores', fn (Usuario $usuario): bool => (int) $usuario->getKey() === 1 && $usuario->rol()->where('nombre_rol', 'Administrador')->exists());

        RateLimiter::for('recuperacion-solicitar', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('recuperacion-confirmar', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('registro', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));

        Gate::define('administrar-catalogos', fn (Usuario $usuario): bool => $usuario->rol()->where('nombre_rol', 'Administrador')->exists()
        );

        // Mismo criterio (rol Administrador) para el resto del panel: pedidos, clientes, reportes.
        Gate::define('administrar-panel', fn (Usuario $usuario): bool => $usuario->rol()->where('nombre_rol', 'Administrador')->exists()
        );
    }
}
