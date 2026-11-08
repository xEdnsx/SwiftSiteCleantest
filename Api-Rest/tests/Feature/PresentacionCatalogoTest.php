<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Usuario;
use Database\Seeders\CategoriasServicioSeeder;
use Database\Seeders\PresentacionCatalogo;
use Database\Seeders\TarifasItemsSeeder;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cómo se muestran los servicios en la app: viene de la base de datos, no del código. */
class PresentacionCatalogoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['roles', 'usuarios', 'categorias_servicio'] as $table) {
            (require glob(database_path("migrations/*_create_{$table}_table.php"))[0])->up();
        }
        DB::statement('CREATE TABLE tarifas_items (id_tarifa INTEGER PRIMARY KEY AUTOINCREMENT, id_categoria INTEGER NOT NULL REFERENCES categorias_servicio(id_categoria), tipo_item VARCHAR(100) NOT NULL, material VARCHAR(80), precio_unitario DECIMAL(10,2) NOT NULL, activo BOOLEAN NOT NULL DEFAULT 1)');
        DB::statement('CREATE TABLE detalle_pedidos (id_detalle INTEGER PRIMARY KEY, id_tarifa INTEGER NOT NULL)');
    }

    private function migrar(): void
    {
        (require glob(database_path('migrations/*_add_presentacion_to_catalogo.php'))[0])->up();
    }

    public function test_tariff_seeder_preserves_admin_prices_hidden_tariffs_and_custom_services(): void
    {
        $this->migrar();
        $this->seed(CategoriasServicioSeeder::class);
        $this->seed(TarifasItemsSeeder::class);
        $tarifa = DB::table('tarifas_items')->first();
        DB::table('tarifas_items')->where('id_tarifa', $tarifa->id_tarifa)->update(['precio_unitario' => '123.45', 'activo' => false]);
        DB::table('tarifas_items')->insert(['id_categoria' => $tarifa->id_categoria, 'tipo_item' => 'Personalizada', 'material' => null, 'precio_unitario' => 55, 'activo' => true]);
        $before = DB::table('tarifas_items')->orderBy('id_tarifa')->get()->toJson();
        $this->seed(TarifasItemsSeeder::class);
        $this->assertSame($before, DB::table('tarifas_items')->orderBy('id_tarifa')->get()->toJson());
    }

    private function admin(): void
    {
        $rol = Rol::create(['nombre_rol' => 'Administrador']);
        Sanctum::actingAs(Usuario::create(['id_rol' => $rol->getKey(), 'nombre' => 'Admin', 'correo' => 'a@example.com']));
    }

    public function test_migration_keeps_the_texts_the_app_used_to_show_for_existing_services(): void
    {
        $banos = DB::table('categorias_servicio')->insertGetId(['nombre' => 'Baños', 'descripcion' => 'Servicio de limpieza de Baños', 'activo' => 1]);
        $colchones = DB::table('categorias_servicio')->insertGetId(['nombre' => 'Colchones', 'descripcion' => 'Mi texto propio', 'activo' => 1]);
        DB::table('tarifas_items')->insert([
            ['id_categoria' => $banos, 'tipo_item' => 'Baño completo', 'material' => 'Pequeño', 'precio_unitario' => 35],
            ['id_categoria' => $banos, 'tipo_item' => 'Baño completo', 'material' => 'Grande', 'precio_unitario' => 50],
            ['id_categoria' => $colchones, 'tipo_item' => 'Colchón queen', 'material' => null, 'precio_unitario' => 40],
        ]);

        $this->migrar();

        $b = DB::table('categorias_servicio')->where('id_categoria', $banos)->first();
        $this->assertSame('banos', $b->icono);
        $this->assertSame('Tamaño', $b->pregunta_variante);
        $this->assertStringStartsWith('Desinfección', $b->descripcion, 'reemplaza el texto genérico del seeder antiguo');
        // Lo que el administrador ya había escrito no se pisa.
        $this->assertSame('Mi texto propio', DB::table('categorias_servicio')->where('id_categoria', $colchones)->value('descripcion'));

        $tarifas = DB::table('tarifas_items')->get();
        $this->assertSame('hasta 4 m²', $tarifas->firstWhere('material', 'Pequeño')->detalle);
        $this->assertSame('más de 6 m²', $tarifas->firstWhere('material', 'Grande')->detalle);
        $this->assertSame('150 × 200 cm', $tarifas->firstWhere('tipo_item', 'Colchón queen')->detalle);
        $this->assertStringContainsString('ducha', $tarifas->firstWhere('material', 'Pequeño')->descripcion);
    }

    public function test_applying_it_twice_never_overwrites_what_an_admin_changed(): void
    {
        $this->migrar();
        DB::table('categorias_servicio')->insert(['nombre' => 'Sillas', 'activo' => 1]);
        PresentacionCatalogo::aplicar();
        DB::table('categorias_servicio')->where('nombre', 'Sillas')->update(['pregunta_cantidad' => '¿Cuántas?', 'icono' => 'pisos']);

        PresentacionCatalogo::aplicar();

        $fila = DB::table('categorias_servicio')->where('nombre', 'Sillas')->first();
        $this->assertSame('¿Cuántas?', $fila->pregunta_cantidad);
        $this->assertSame('pisos', $fila->icono);
        $this->assertSame('Sillas', $fila->unidad);
    }

    public function test_seeders_leave_a_fresh_install_with_complete_presentation_and_do_not_reactivate_hidden_services(): void
    {
        $this->migrar();
        $this->seed(CategoriasServicioSeeder::class);
        $this->seed(TarifasItemsSeeder::class);

        $this->assertSame(4, DB::table('categorias_servicio')->whereNotNull('icono')->count());
        $this->assertSame(4, DB::table('tarifas_items')->whereNotNull('detalle')->where('tipo_item', 'like', 'Colchón %')->count());

        DB::table('categorias_servicio')->where('nombre', 'Sillas')->update(['activo' => 0, 'descripcion' => 'Editada']);
        $this->seed(CategoriasServicioSeeder::class);
        $sillas = DB::table('categorias_servicio')->where('nombre', 'Sillas')->first();
        $this->assertEquals(0, $sillas->activo);
        $this->assertSame('Editada', $sillas->descripcion);
    }

    public function test_admin_creates_a_new_service_with_its_presentation_and_the_public_api_serves_it(): void
    {
        $this->migrar();
        $this->admin();

        $id = $this->postJson('/api/categorias', [
            'nombre' => 'Limpieza de pisos', 'descripcion' => 'Pisos de cerámica y porcelanato.', 'icono' => 'pisos',
            'pregunta_tipo' => '¿Qué piso es?', 'pregunta_variante' => 'Acabado', 'pregunta_cantidad' => '¿Cuántos metros cuadrados?',
            'unidad' => 'm²', 'nota' => 'Incluye zócalos.', 'cantidad_max' => 500,
        ])->assertCreated()->assertJsonPath('icono', 'pisos')->assertJsonPath('cantidad_max', 500)->json('id_categoria');

        $this->postJson('/api/tarifas', [
            'id_categoria' => $id, 'tipo_item' => 'Piso de cerámica', 'material' => 'Brillante', 'precio_unitario' => '1.50',
            'detalle' => 'por m²', 'descripcion' => 'Incluye zócalos y esquinas.',
        ])->assertCreated()->assertJsonPath('detalle', 'por m²');

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/categorias?activo=1')->assertOk()->assertJsonPath('0.unidad', 'm²')->assertJsonPath('0.pregunta_cantidad', '¿Cuántos metros cuadrados?');
        $this->getJson("/api/tarifas?id_categoria=$id")->assertOk()->assertJsonPath('0.descripcion', 'Incluye zócalos y esquinas.');
    }

    public function test_presentation_fields_are_optional_clearable_and_validated(): void
    {
        $this->migrar();
        $this->admin();

        $id = $this->postJson('/api/categorias', ['nombre' => 'Cisternas', 'icono' => 'cisterna', 'nota' => 'Aviso'])->assertCreated()->json('id_categoria');
        $this->postJson('/api/categorias', ['nombre' => 'Sin extras'])->assertCreated()->assertJsonPath('icono', null)->assertJsonPath('cantidad_max', null);

        $this->patchJson("/api/categorias/$id", ['nota' => '', 'icono' => null])->assertOk()->assertJsonPath('nota', null)->assertJsonPath('icono', null);
        $this->patchJson("/api/categorias/$id", ['icono' => 'Con Espacios!'])->assertUnprocessable()->assertJsonValidationErrors('icono');
        $this->patchJson("/api/categorias/$id", ['cantidad_max' => 0])->assertUnprocessable()->assertJsonValidationErrors('cantidad_max');
        $this->patchJson("/api/categorias/$id", ['cantidad_max' => 10001])->assertUnprocessable()->assertJsonValidationErrors('cantidad_max');
        $this->patchJson("/api/categorias/$id", ['unidad' => str_repeat('x', 41)])->assertUnprocessable()->assertJsonValidationErrors('unidad');

        $this->postJson('/api/tarifas', ['id_categoria' => $id, 'tipo_item' => 'Cisterna', 'precio_unitario' => 20, 'detalle' => str_repeat('x', 81)])
            ->assertUnprocessable()->assertJsonValidationErrors('detalle');
    }
}
