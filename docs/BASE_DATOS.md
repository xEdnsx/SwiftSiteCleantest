# Base de datos

Laravel utiliza el driver `mysql`. El esquema fuente está en `Api-Rest/database/migrations`; las semillas se encuentran en `database/seeders`. No distribuir bases locales, dumps con registros reales ni el archivo sin extensión `Api-Rest/swiftsite_clean`, identificado como SQLite local.

| Tabla | Clave primaria | Relaciones y datos |
| --- | --- | --- |
| `roles` | `id_rol` | `nombre_rol` único; tiene usuarios |
| `usuarios` | `id_usuario` | `id_rol` → roles; nombre, teléfono, correo único y password_hash |
| `categorias_servicio` | `id_categoria` | nombre único, descripción y activo |
| `tarifas_items` | `id_tarifa` | `id_categoria` → categorías; tipo, material, precio_unitario y activo |
| `zonas_cobertura` | `id_zona` | nombre único, recargo y activo |
| `pedidos` | `id_pedido` | `id_usuario` nullable → usuarios; `id_zona` → zonas; dirección, fechas, estado e importes |
| `detalle_pedidos` | `id_detalle` | `id_pedido` → pedidos; `id_tarifa` → tarifas; cantidad e importes |

Las claves foráneas restringen eliminación de registros relacionados y actualizan las referencias en cascada. Los campos monetarios son DECIMAL(10,2); las restricciones exigen importes no negativos y cantidad positiva en el detalle. Las tablas de negocio no tienen timestamps convencionales de Eloquent; pedidos usa `fecha_creacion`.

También se conservan las migraciones iniciales de infraestructura: users, password_reset_tokens, sessions, cache/cache_locks, jobs/job_batches/failed_jobs y personal_access_tokens de Sanctum. La autenticación de negocio utiliza usuarios, no users. No eliminar migraciones ya aplicadas para simplificar la apariencia del esquema.

## Inicializar una base nueva

1. Instalar y arrancar un servidor MySQL compatible con CHECK constraints. La comprobación local se realizó con MariaDB 10.4.32 y driver mysql.
2. Crear una base vacía y un usuario propio con permisos sobre esa base. No usar una base productiva ni compartir la contraseña en Git.
3. Copiar `.env.example` a `.env` solo si este no existe, y completar DB_DATABASE, DB_USERNAME y DB_PASSWORD.
4. Desde Api-Rest, ejecutar:

```bash
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
```

`DatabaseSeeder` ejecuta RolesSeeder, CategoriasServicioSeeder, ZonasCoberturaSeeder y TarifasItemsSeeder. Crea Cliente/Administrador y catálogos de ejemplo; no crea una cuenta administrativa ni una contraseña común.

Los seeders usan updateOrInsert. Reejecutarlos puede restablecer precios, recargos o indicadores activo; revisar antes de hacerlo sobre datos ya personalizados. No se ejecutaron durante la preparación de GitHub.

## Cambios de esquema y pruebas

Agregar una migración nueva para cambios acordados. Revisar índices, claves, precisión decimal y reversibilidad; no editar o borrar migraciones aplicadas por otros integrantes sin coordinar. Nunca utilizar migrate:fresh o DROP como procedimiento habitual de actualización.

La suite PHPUnit existente utiliza SQLite en memoria para fixtures de pruebas. Las migraciones monetarias incluyen ALTER TABLE ADD CONSTRAINT de MySQL, por lo que algunos tests definen un esquema de prueba específico. Esto no cambia la conexión de la aplicación.

`php scripts/verify-sprint2.php` verifica el esquema y la autenticación con el MySQL local, creando fixtures en una transacción y revirtiéndola. No modifica usuarios existentes ni deja tokens de prueba; sí puede consumir números de autoincremento. Ejecutar solo en un entorno local preparado.
