<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Usuario;
use Database\Seeders\AdministradoresSeeder;
use Database\Seeders\RolesSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdministradoresSeederTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id_rol');
            $table->string('nombre_rol', 30)->unique();
        });

        Schema::create('usuarios', function (Blueprint $table) {
            $table->increments('id_usuario');
            $table->unsignedInteger('id_rol');
            $table->string('nombre', 120);
            $table->string('telefono', 25)->nullable();
            $table->string('correo', 150)->nullable()->unique();
            $table->string('password_hash', 255)->nullable();
            $table->string('terminos_version', 20)->nullable();
            $table->dateTime('terminos_aceptados_en')->nullable();
        });
    }

    public function test_seeder_crea_los_cinco_administradores_con_hash_y_rol_correcto(): void
    {
        $this->seed(RolesSeeder::class);
        $this->seed(AdministradoresSeeder::class);

        $correosEsperados = [
            'demianbucaro@gmail.com',
            'sorianocamposedenilson@gmail.com',
            'cab.brayan.com@gmail.com',
            'franciscojavierortiz710@gmail.com',
            'hailyaneth0106@gmail.com',
        ];

        $rolAdmin = Rol::where('nombre_rol', 'Administrador')->firstOrFail();

        $this->assertCount(5, $correosEsperados);

        foreach ($correosEsperados as $correo) {
            $admin = Usuario::where('correo', $correo)->first();
            $this->assertNotNull($admin, "El administrador {$correo} debería haber sido creado.");
            $this->assertSame($rolAdmin->id_rol, $admin->id_rol);
            $this->assertNotEmpty($admin->password_hash);
            // Verificar que sea un hash bcrypt o argon2 válido y no texto plano
            $this->assertTrue(str_starts_with($admin->password_hash, '$2y$') || str_starts_with($admin->password_hash, '$argon2'));
        }
    }

    public function test_seeder_es_estrictamente_idempotente_y_no_sobrescribe_claves(): void
    {
        $this->seed(RolesSeeder::class);

        // Pre-creamos a uno de los integrantes con una contraseña fija conocida
        $rolAdmin = Rol::where('nombre_rol', 'Administrador')->firstOrFail();
        $passwordOriginal = 'ClavePreviaSuperSegura123!';

        $usuarioPreexistente = Usuario::create([
            'id_rol' => $rolAdmin->id_rol,
            'nombre' => 'Demian Original',
            'correo' => 'demianbucaro@gmail.com',
            'password_hash' => $passwordOriginal,
        ]);

        $hashOriginal = $usuarioPreexistente->password_hash;
        $this->assertTrue(Hash::check($passwordOriginal, $hashOriginal));

        // Ejecutar el seeder la primera vez
        $this->seed(AdministradoresSeeder::class);

        $usuarioDespues = Usuario::where('correo', 'demianbucaro@gmail.com')->first();
        $this->assertSame('Demian Original', $usuarioDespues->nombre, 'No debe sobrescribir el nombre de un usuario existente.');
        $this->assertSame($hashOriginal, $usuarioDespues->password_hash, 'No debe cambiar la contraseña de un usuario existente.');

        // Debe haber exactamente 5 administradores en total
        $this->assertSame(5, Usuario::where('id_rol', $rolAdmin->id_rol)->count());

        // Guardamos los hashes de los 5 usuarios
        $todos = Usuario::all();
        $hashesAntes = $todos->pluck('password_hash', 'correo')->toArray();

        // Ejecutar el seeder una segunda vez completa
        $this->seed(AdministradoresSeeder::class);

        // No debe duplicar registros ni cambiar ningún hash
        $this->assertSame(5, Usuario::where('id_rol', $rolAdmin->id_rol)->count());

        foreach (Usuario::all() as $usuario) {
            $this->assertSame($hashesAntes[$usuario->correo], $usuario->password_hash, "La contraseña de {$usuario->correo} no debió alterarse en ejecuciones repetidas.");
        }
    }

    public function test_las_contrasenas_generadas_son_distintas_entre_los_usuarios(): void
    {
        $this->seed(RolesSeeder::class);
        $this->seed(AdministradoresSeeder::class);

        $hashes = Usuario::pluck('password_hash')->toArray();
        $this->assertCount(5, $hashes);
        // Cada hash debe ser único
        $this->assertCount(5, array_unique($hashes));
    }
}
