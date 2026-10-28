<?php

use App\Models\CategoriaServicio;
use App\Models\Rol;
use App\Models\TarifaItem;
use App\Models\Usuario;
use App\Models\ZonaCobertura;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// Integration with the configured MySQL database. All fixture writes are rolled back.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

function check(bool $condition, string $name): void
{
    if (! $condition) {
        throw new RuntimeException($name);
    }
    echo "PASS $name\n";
}

config(['cache.default' => 'array', 'session.driver' => 'array']);
$db = DB::connection();
$transactionStarted = false;
try {
    check($db->getDriverName() === 'mysql', 'MySQL driver');
    $db->getPdo();
    check(true, 'MySQL connection');
    foreach (['roles', 'usuarios', 'categorias_servicio', 'tarifas_items', 'zonas_cobertura', 'pedidos', 'detalle_pedidos', 'personal_access_tokens'] as $table) {
        check($db->getSchemaBuilder()->hasTable($table), "table $table");
        $engine = $db->selectOne('SELECT ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [$table]);
        check(strtolower($engine->engine ?? '') === 'innodb', "transactional engine $table");
    }
    foreach (['usuarios', 'tarifas_items', 'pedidos', 'detalle_pedidos'] as $table) {
        check(count($db->getSchemaBuilder()->getForeignKeys($table)) > 0, "foreign keys $table");
    }
    foreach (['tarifas_items' => ['precio_unitario'], 'zonas_cobertura' => ['recargo'], 'pedidos' => ['subtotal', 'recargo_zona', 'total'], 'detalle_pedidos' => ['precio_unitario', 'subtotal']] as $table => $columns) {
        foreach ($columns as $column) {
            $metadata = $db->selectOne('SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [$table, $column]);
            check(strtolower($metadata->type ?? '') === 'decimal(10,2)', "money $table.$column");
        }
    }

    $db->beginTransaction();
    $transactionStarted = true;
    $suffix = bin2hex(random_bytes(6));
    $password = bin2hex(random_bytes(16));
    $call = function (string $method, string $path, array $body = [], ?string $token = null) use ($kernel, $app): array {
        Auth::forgetGuards();
        $server = ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json'];
        if ($token) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
        }
        $request = Request::create('/api'.$path, $method, [], [], [], $server, json_encode($body));
        $app->instance('request', $request);
        $response = $kernel->handle($request);
        $result = [$response->getStatusCode(), json_decode($response->getContent(), true)];
        $kernel->terminate($request, $response);

        return $result;
    };

    $category = CategoriaServicio::create(['nombre' => 'Sprint2-'.$suffix]);
    $tariff = TarifaItem::create(['id_categoria' => $category->getKey(), 'tipo_item' => 'Sprint2', 'precio_unitario' => '12.35']);
    $zone = ZonaCobertura::create(['nombre' => 'Sprint2-'.$suffix, 'recargo' => '2.10']);
    foreach (['/categorias', '/tarifas', '/zonas'] as $path) {
        check($call('GET', $path)[0] === 200, "GET $path via Eloquent/MySQL");
    }
    [$status, $quote] = $call('POST', '/cotizaciones/preliminar', ['id_zona' => $zone->getKey(), 'items' => [['id_tarifa' => $tariff->getKey(), 'cantidad' => 3]]]);
    check($status === 200 && $quote['total'] === '39.15', 'server quote with MySQL prices');

    $credentials = ['nombre' => 'Sprint2', 'correo' => 'sprint2-'.$suffix.'@example.invalid', 'password' => $password, 'password_confirmation' => $password];
    [$status, $registration] = $call('POST', '/register', $credentials);
    check($status === 201 && $registration['usuario']['rol']['nombre_rol'] === 'Cliente', 'client registration');
    [$status, $login] = $call('POST', '/login', $credentials + ['portal' => 'cliente']);
    check($status === 200, 'client login');
    $clientToken = $login['token'];
    check($call('POST', '/login', array_replace($credentials, ['password' => 'wrong-password']))[0] === 401, 'wrong password 401');
    check($call('POST', '/login', $credentials + ['portal' => 'administrador'])[0] === 403, 'client denied admin portal');
    check($call('GET', '/me', [], $clientToken)[0] === 200, 'authenticated profile');
    check($call('POST', '/categorias', ['nombre' => 'Forbidden'], $clientToken)[0] === 403, 'client denied admin API');
    check($call('POST', '/categorias', ['nombre' => 'Forbidden'])[0] === 401, 'guest denied admin API');

    $adminRole = Rol::firstOrCreate(['nombre_rol' => 'Administrador']);
    $admin = Usuario::create(['id_rol' => $adminRole->getKey(), 'nombre' => 'Sprint2', 'correo' => 'admin-'.$suffix.'@example.invalid', 'password_hash' => $password]);
    [$status, $adminLogin] = $call('POST', '/login', ['correo' => $admin->correo, 'password' => $password, 'portal' => 'administrador']);
    check($status === 200, 'admin login');
    check($call('POST', '/categorias', ['nombre' => 'Admin-'.$suffix], $adminLogin['token'])[0] === 201, 'admin authorized API');
    check($call('POST', '/logout', [], $clientToken)[0] === 204, 'logout');
    check($call('GET', '/me', [], $clientToken)[0] === 401, 'revoked token rejected');
    $db->rollBack();
    $transactionStarted = false;
    check(! Usuario::where('correo', $credentials['correo'])->exists(), 'fixtures rolled back, no test users persisted');
    echo "Integration completed. Existing records were not modified.\n";
} catch (Throwable $exception) {
    if ($transactionStarted) {
        $db->rollBack();
    }
    // Avoid leaking connection strings, SQL bindings, credentials or tokens.
    fwrite(STDERR, 'FAIL integration: '.($exception instanceof RuntimeException && ! $exception instanceof PDOException ? $exception->getMessage() : get_class($exception)).PHP_EOL);
    exit(1);
}
