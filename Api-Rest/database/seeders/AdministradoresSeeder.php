<?php

namespace Database\Seeders;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeder para registrar a los cinco integrantes del equipo como Administradores.
 *
 * Características de seguridad:
 * - Es estrictamente idempotente: no duplica usuarios existentes ni sobrescribe contraseñas existentes.
 * - Genera contraseñas aleatorias criptográficamente seguras de 16 caracteres para cada cuenta nueva.
 * - Almacena las contraseñas mediante el mecanismo de hash de Laravel ('password_hash' => 'hashed').
 * - Si se crean cuentas nuevas, muestra las credenciales en la consola y las guarda en un archivo temporal
 *   protegido en storage/app/private/admin-credentials-initial.json (ignorado por Git).
 * - En ejecuciones posteriores, si las 5 cuentas ya existen, no genera contraseñas ni altera nada.
 */
class AdministradoresSeeder extends Seeder
{
    /** Lista oficial de administradores de SwiftSite Clean */
    public const INTEGRANTES = [
        [
            'nombre' => 'Demian Búcaro',
            'correo' => 'demianbucaro@gmail.com',
            'telefono' => null,
        ],
        [
            'nombre' => 'Edenilson Soriano Campos',
            'correo' => 'sorianocamposedenilson@gmail.com',
            'telefono' => null,
        ],
        [
            'nombre' => 'Brayan Cab',
            'correo' => 'cab.brayan.com@gmail.com',
            'telefono' => null,
        ],
        [
            'nombre' => 'Francisco Javier Ortiz',
            'correo' => 'franciscojavierortiz710@gmail.com',
            'telefono' => null,
        ],
        [
            'nombre' => 'Haily Aneth',
            'correo' => 'hailyaneth0106@gmail.com',
            'telefono' => null,
        ],
    ];

    public function run(): void
    {
        $rolAdmin = Rol::where('nombre_rol', 'Administrador')->first();

        if (! $rolAdmin) {
            $rolAdmin = Rol::create(['nombre_rol' => 'Administrador']);
        }

        $nuevosCreados = [];

        foreach (self::INTEGRANTES as $integrante) {
            $correo = mb_strtolower(trim($integrante['correo']));

            $existente = Usuario::where('correo', $correo)->first();

            if ($existente) {
                // El usuario ya existe: NO regenerar contraseña ni alterar datos personales.
                // Si por alguna razón pertenecía a un rol distinto pero es del equipo, garantizar rol Administrador.
                if ($existente->id_rol !== $rolAdmin->id_rol) {
                    $existente->update(['id_rol' => $rolAdmin->id_rol]);
                    $this->command?->warn("El usuario {$correo} ya existía con otro rol; se actualizó a Administrador.");
                } else {
                    $this->command?->line("El usuario {$correo} ya está registrado como Administrador. Omitiendo.");
                }
                continue;
            }

            // Generar contraseña aleatoria y segura para esta cuenta (ej: 16 caracteres alfanuméricos + símbolos)
            $passwordPlana = Str::random(12).Str::password(4, letters: true, numbers: true, symbols: true, spaces: false);

            $nuevoUsuario = Usuario::create([
                'id_rol' => $rolAdmin->id_rol,
                'nombre' => $integrante['nombre'],
                'correo' => $correo,
                'telefono' => $integrante['telefono'],
                'password_hash' => $passwordPlana, // El cast 'hashed' de Usuario realiza Hash::make() automáticamente
                'terminos_version' => config('legal.version', '2026-11-08'),
                'terminos_aceptados_en' => now(),
            ]);

            $nuevosCreados[] = [
                'id_usuario' => $nuevoUsuario->id_usuario,
                'nombre' => $nuevoUsuario->nombre,
                'correo' => $nuevoUsuario->correo,
                'password_temporal' => $passwordPlana,
            ];

            $this->command?->info("✓ Administrador registrado: {$correo}");
        }

        if (! empty($nuevosCreados)) {
            $this->entregarCredenciales($nuevosCreados);
        } else {
            $this->command?->info('No se crearon administradores nuevos. Todos ya se encontraban registrados.');
        }
    }

    /**
     * Entrega segura de credenciales temporales.
     * Muestra la tabla en consola durante la ejecución inicial y genera un archivo en storage privado.
     *
     * @param array<int, array{id_usuario: int, nombre: string, correo: string, password_temporal: string}> $credenciales
     */
    protected function entregarCredenciales(array $credenciales): void
    {
        $rutaArchivo = storage_path('app/private/admin-credentials-initial.json');

        // Guardar archivo JSON local temporal en storage/app/private/ (protegido por .gitignore)
        if (! is_dir(dirname($rutaArchivo))) {
            mkdir(dirname($rutaArchivo), 0755, true);
        }

        $contenido = json_encode([
            'generado_en' => now()->toIso8601String(),
            'aviso' => 'IMPORTANTE: Entrega estas contraseñas de forma privada a cada integrante y solicita cambiarlas tras el primer inicio de sesión. Elimina este archivo luego de repartirlas.',
            'administradores' => $credenciales,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        file_put_contents($rutaArchivo, $contenido);

        if ($this->command) {
            $this->command->newLine();
            $this->command->alert('CREDENCIALES INICIALES DE ADMINISTRADORES GENERADAS');
            $this->command->table(
                ['ID', 'Nombre', 'Correo', 'Contraseña Temporal'],
                array_map(fn ($c) => [$c['id_usuario'], $c['nombre'], $c['correo'], $c['password_temporal']], $credenciales)
            );
            $this->command->warn("Archivo guardado en: {$rutaArchivo}");
            $this->command->warn('Este archivo está en storage/app/private/ (excluido de Git). Elimínalo tras entregar las credenciales.');
            $this->command->newLine();
        }
    }
}
