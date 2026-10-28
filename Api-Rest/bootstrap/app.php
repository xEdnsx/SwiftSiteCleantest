<?php

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn (Request $request): ?string => $request->is('api', 'api/*') ? null : '/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request, Throwable $exception): bool => $request->is('api', 'api/*') || $request->expectsJson()
        );
        $exceptions->render(function (QueryException $exception, Request $request) {
            if ($request->is('api/*') && in_array((string) ($exception->errorInfo[0] ?? ''), ['23000', '23503', '23505'], true)) {
                return response()->json(['message' => 'La operacion entra en conflicto con los datos existentes.'], 409);
            }
        });
    })->create();
