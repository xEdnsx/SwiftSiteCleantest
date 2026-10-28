<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\CotizacionController;
use App\Http\Controllers\Api\TarifaController;
use App\Http\Controllers\Api\ZonaController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:registro');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/cotizaciones/preliminar', [CotizacionController::class, 'store'])->middleware('throttle:60,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::get('/prueba', fn () => response()->json([
    'mensaje' => 'API SwiftSite Clean funcionando',
    'estado' => 'correcto',
]));

Route::apiResource('categorias', CategoriaController::class)->only(['index', 'show']);
Route::apiResource('tarifas', TarifaController::class)->only(['index', 'show']);
Route::apiResource('zonas', ZonaController::class)->only(['index', 'show']);

Route::middleware(['auth:sanctum', 'can:administrar-catalogos'])->group(function () {
    Route::apiResource('categorias', CategoriaController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('tarifas', TarifaController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('zonas', ZonaController::class)->only(['store', 'update', 'destroy']);
});
