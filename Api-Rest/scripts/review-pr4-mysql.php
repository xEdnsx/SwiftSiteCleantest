<?php

use App\Mail\ReclamarCuenta;
use App\Models\CategoriaServicio;
use App\Models\Rol;
use App\Models\TarifaItem;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

function verify(bool $ok, string $label): void
{
    if (! $ok) {
        throw new RuntimeException($label);
    }
    echo "PASS $label\n";
}

try {
    // Hard guard: this script only works with our isolated server, never the configured real database.
    $pdo = new PDO('mysql:host=127.0.0.1;port=3307', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $actual = $pdo->query('SELECT @@datadir')->fetchColumn();
    $expected = realpath(__DIR__.'/../.github-prep/pr4/mysql-data');
    verify($expected && strcasecmp(rtrim(str_replace('\\', '/', $actual), '/'), str_replace('\\', '/', $expected)) === 0, 'isolated data directory verified');
    $database = 'pr4_review_'.date('YmdHis');
    $pdo->exec("CREATE DATABASE `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    config(['database.default' => 'mysql', 'database.connections.mysql.host' => '127.0.0.1', 'database.connections.mysql.port' => 3307,
        'database.connections.mysql.database' => $database, 'database.connections.mysql.username' => 'root',
        'database.connections.mysql.password' => '', 'database.connections.mysql.url' => null,
        'cache.default' => 'array', 'session.driver' => 'array', 'mail.default' => 'smtp']);
    DB::purge('mysql');
    $baseline = array_values(array_map(fn ($file) => 'database/migrations/'.basename($file), array_filter(glob(__DIR__.'/../database/migrations/*.php'), fn ($file) => basename($file) < '2026_11')));
    verify(Artisan::call('migrate', ['--path' => $baseline, '--force' => true]) === 0, 'main baseline migrations');
    $rol = Rol::create(['nombre_rol' => 'Cliente']);
    $legacy = Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Legacy fixture', 'correo' => 'legacy@example.invalid']);
    $cat = CategoriaServicio::create(['nombre' => 'Sillas', 'descripcion' => 'Texto administrativo']);
    $zone = ZonaCobertura::create(['nombre' => 'San Salvador Centro', 'recargo' => '17.25', 'activo' => false]);
    $tariff = TarifaItem::create(['id_categoria' => $cat->getKey(), 'tipo_item' => 'Legacy fixture', 'precio_unitario' => '123.45', 'activo' => false]);
    verify(Artisan::call('migrate', ['--force' => true]) === 0, 'upgrade main schema to PR4');
    verify($legacy->fresh()->nombre === 'Legacy fixture' && $cat->fresh()->descripcion === 'Texto administrativo', 'existing fixtures preserved during upgrade');
    verify(Artisan::call('migrate', ['--force' => true]) === 0, 'second migrate has no duplicate schema operations');
    verify(Artisan::call('migrate:status') === 0, 'migration status on isolated MySQL');
    verify(Artisan::call('optimize:clear') === 0, 'optimize clear with isolated cache');
    Artisan::call('db:seed', ['--force' => true]);
    Artisan::call('db:seed', ['--force' => true]);
    verify($zone->fresh()->recargo === '17.25' && ! $zone->fresh()->activo, 'zone seeder preserves admin edits');
    verify($tariff->fresh()->precio_unitario === '123.45' && ! $tariff->fresh()->activo, 'tariff seeder preserves admin edits');
    foreach (['reportes', 'valoraciones', 'usuarios', 'pedidos'] as $table) {
        verify(count(DB::getSchemaBuilder()->getForeignKeys($table)) > 0, "foreign keys $table");
    }

    $call = function (string $method, string $path, array $body = [], ?string $token = null) use ($app, $kernel): array {
        Auth::forgetGuards();
        $headers = ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json'];
        if ($token) {
            $headers['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
        }
        $request = Request::create('/api'.$path, $method, [], [], [], $headers, json_encode($body));
        $app->instance('request', $request);
        $response = $kernel->handle($request);
        $result = [$response->getStatusCode(), json_decode($response->getContent(), true)];
        $kernel->terminate($request, $response);

        return $result;
    };
    $password = bin2hex(random_bytes(16));
    $registration = ['nombre' => 'Client fixture', 'correo' => 'client@example.invalid', 'password' => $password, 'password_confirmation' => $password, 'acepta_terminos' => true];
    [$status, $data] = $call('POST', '/register', $registration);
    verify($status === 201, 'client registration on MySQL');
    $client = $data['token'];
    [$status] = $call('POST', '/login', $registration + ['portal' => 'cliente']);
    verify($status === 200, 'client login');
    verify($call('POST', '/login', array_replace($registration, ['password' => 'incorrecta']))[0] === 401, 'wrong credentials rejected');
    $adminRole = Rol::firstOrCreate(['nombre_rol' => 'Administrador']);
    $adminUser = Usuario::create(['id_rol' => $adminRole->getKey(), 'nombre' => 'Admin fixture', 'correo' => 'admin@example.invalid', 'password_hash' => $password]);
    [$status, $data] = $call('POST', '/login', ['correo' => $adminUser->correo, 'password' => $password, 'portal' => 'administrador']);
    verify($status === 200, 'admin login');
    $admin = $data['token'];
    foreach (['categorias', 'tarifas', 'zonas'] as $path) {
        verify($call('GET', '/'.$path)[0] === 200, "catalog $path");
    }
    $activeZone = ZonaCobertura::where('activo', true)->firstOrFail();
    $activeTariff = TarifaItem::where('activo', true)->firstOrFail();
    $order = ['id_zona' => $activeZone->getKey(), 'items' => [['id_tarifa' => $activeTariff->getKey(), 'cantidad' => 2]], 'direccion' => 'Direccion de prueba aislada 123', 'fecha_servicio' => now()->addDay()->toDateString(), 'franja_horaria' => '10:00'];
    verify($call('POST', '/cotizaciones/preliminar', $order)[0] === 200, 'quote');
    [$status, $data] = $call('POST', '/pedidos', $order, $client);
    verify($status === 201, 'order persisted');
    $orderId = $data['id_pedido'];
    verify($call('GET', '/mis-pedidos/'.$orderId, [], $client)[0] === 200, 'own order retrieved');
    foreach (['resumen', 'clientes', 'pedidos', 'reportes', 'valoraciones'] as $path) {
        $endpoint = '/admin/'.$path.($path === 'resumen' ? '?fecha='.now()->toDateString() : '');
        verify($call('GET', $endpoint, [], $client)[0] === 403, "client denied admin $path");
        verify($call('GET', $endpoint, [], $admin)[0] === 200, "admin $path");
    }
    foreach (['Confirmado', 'En proceso', 'Finalizado'] as $state) {
        verify($call('PATCH', "/admin/pedidos/$orderId/estado", ['estado' => $state], $admin)[0] === 200, "order state $state");
    }
    verify($call('POST', '/reportes', ['id_pedido' => $orderId, 'motivo' => 'Otro', 'descripcion' => 'Un problema de prueba aislada.'], $client)[0] === 201, 'report persisted');
    [$status, $rating] = $call('POST', '/valoraciones', ['id_pedido' => $orderId, 'estrellas' => 5, 'comentario' => 'Comentario de prueba'], $client);
    verify($status === 201, 'rating persisted');
    verify($call('PATCH', '/admin/valoraciones/'.$rating['id_valoracion'], ['estado' => 'Publicada'], $admin)[0] === 200, 'rating moderation');
    verify(count($call('GET', '/valoraciones-publicas')[1]) === 1, 'only moderated rating is public');
    Mail::fake();
    $claim = array_replace($registration, ['correo' => $legacy->correo]);
    verify($call('POST', '/register', $claim)[0] === 202 && $legacy->fresh()->password_hash === null, 'email claim requires verification');
    $code = Mail::sent(ReclamarCuenta::class)->first()->codigo;
    verify($call('POST', '/register', $claim + ['claim_token' => $code])[0] === 201, 'verified email claim');
    verify($call('POST', '/register', $claim + ['claim_token' => $code])[0] === 422, 'claim replay rejected');
    verify($call('POST', '/logout', [], $client)[0] === 204 && $call('GET', '/me', [], $client)[0] === 401, 'logout revokes token');
    echo "Isolated integration complete. No real database was accessed. Mail transport was faked.\n";
} catch (Throwable $exception) {
    // Never print SQL bindings, passwords or tokens on errors.
    fwrite(STDERR, 'FAIL: '.($exception instanceof RuntimeException && ! $exception instanceof PDOException ? $exception->getMessage() : get_class($exception)).PHP_EOL);
    exit(1);
}
