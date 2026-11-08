<?php

use App\Http\Controllers\Api\Admin\ClienteAdminController;
use App\Http\Controllers\Api\Admin\PedidoAdminController;
use App\Http\Controllers\Api\Admin\PendientesAdminController;
use App\Http\Controllers\Api\Admin\ReporteAdminController;
use App\Http\Controllers\Api\Admin\ResumenAdminController;
use App\Http\Controllers\Api\Admin\ValoracionAdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\CotizacionController;
use App\Http\Controllers\Api\PedidoController;
use App\Http\Controllers\Api\PerfilController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\TarifaController;
use App\Http\Controllers\Api\ValoracionController;
use App\Http\Controllers\Api\ZonaController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:registro');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/cotizaciones/preliminar', [CotizacionController::class, 'store'])->middleware('throttle:60,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Perfil de la persona autenticada.
    Route::patch('/me', [PerfilController::class, 'update']);
    Route::put('/me/password', [PerfilController::class, 'cambiarPassword'])->middleware('throttle:6,1');
    Route::delete('/me', [PerfilController::class, 'destroy'])->middleware('throttle:6,1');

    // Pedidos de la persona autenticada (app del cliente).
    Route::post('/pedidos', [PedidoController::class, 'store'])->middleware('throttle:30,1');
    Route::get('/mis-pedidos', [PedidoController::class, 'index']);
    Route::get('/mis-pedidos/{pedido}', [PedidoController::class, 'show']);

    // Reportes de problemas sobre pedidos finalizados.
    Route::post('/reportes', [ReporteController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/mis-reportes', [ReporteController::class, 'index']);

    // Valoraciones de pedidos finalizados (se publican cuando el administrador las aprueba).
    Route::post('/valoraciones', [ValoracionController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/mis-valoraciones', [ValoracionController::class, 'index']);
});

Route::get('/prueba', fn () => response()->json([
    'mensaje' => 'API SwiftSite Clean funcionando',
    'estado' => 'correcto',
]));

Route::apiResource('categorias', CategoriaController::class)->only(['index', 'show']);
Route::apiResource('tarifas', TarifaController::class)->only(['index', 'show']);
Route::apiResource('zonas', ZonaController::class)->only(['index', 'show']);
// Opiniones que el administrador decidió mostrar en el Inicio de la app (pública, sin datos de contacto).
Route::get('/valoraciones-publicas', [ValoracionController::class, 'publicas'])->middleware('throttle:60,1');

Route::middleware(['auth:sanctum', 'can:administrar-catalogos'])->group(function () {
    Route::apiResource('categorias', CategoriaController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('tarifas', TarifaController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('zonas', ZonaController::class)->only(['store', 'update', 'destroy']);
});

// Panel administrativo: solo rol Administrador.
Route::middleware(['auth:sanctum', 'can:administrar-panel'])->prefix('admin')->group(function () {
    Route::get('/resumen', ResumenAdminController::class);
    Route::get('/pendientes', PendientesAdminController::class);
    Route::get('/pedidos', [PedidoAdminController::class, 'index']);
    Route::get('/pedidos/{pedido}', [PedidoAdminController::class, 'show']);
    Route::patch('/pedidos/{pedido}/estado', [PedidoAdminController::class, 'actualizarEstado']);

    Route::get('/clientes', [ClienteAdminController::class, 'index']);
    Route::post('/clientes', [ClienteAdminController::class, 'store']);
    Route::get('/clientes/{cliente}', [ClienteAdminController::class, 'show']);
    Route::patch('/clientes/{cliente}', [ClienteAdminController::class, 'update']);
    Route::delete('/clientes/{cliente}', [ClienteAdminController::class, 'destroy']);

    Route::get('/reportes', [ReporteAdminController::class, 'index']);
    Route::patch('/reportes/{reporte}', [ReporteAdminController::class, 'update']);

    Route::get('/valoraciones', [ValoracionAdminController::class, 'index']);
    Route::patch('/valoraciones/{valoracion}', [ValoracionAdminController::class, 'update']);
    Route::delete('/valoraciones/{valoracion}', [ValoracionAdminController::class, 'destroy']);
});
