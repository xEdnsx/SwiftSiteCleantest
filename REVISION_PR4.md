# Revisión y corrección del Pull Request #4

Fecha: 8 de noviembre de 2026.

## 1. Identificación y dictamen

- Repositorio: [xEdnsx/SwiftSiteCleantest](https://github.com/xEdnsx/SwiftSiteCleantest).
- PR: [#4](https://github.com/xEdnsx/SwiftSiteCleantest/pull/4), abierto, no fusionado. Se consultaron metadatos y conversación mediante la conexión GitHub; no había comentarios de revisión en la respuesta.
- Rama revisada y utilizada: `feature/SC-UI-catalogos-cotizar`.
- Commit remoto revisado: `4064c3f1791be646ce9ea9cfdada009a7101f361`.
- Base `origin/main`: `41952b0f19a15c321eeecf879d71fa3aa7961ba9`.
- Diferencia del PR: 152 archivos, 12659 inserciones y 1491 eliminaciones.

**Conclusión: NO APTO PARA MERGE del commit remoto `4064c3f` tal como está publicado.** Contiene una vulnerabilidad de apropiación de cuentas y seeders que sobrescriben configuración administrativa. Las correcciones descritas en este informe están aplicadas y verificadas **localmente**, pero no forman parte todavía de ese commit remoto: por instrucción del usuario no se crearon commits ni se hizo push.

La versión local corregida pasa las comprobaciones detalladas abajo. Para autorizar la fusión del PR se deben incorporar estas correcciones a su rama remota y revisar el nuevo commit, conservando las condiciones de despliegue de correo y base de datos. No debe confundirse “sin conflictos de Git” con “seguro para fusionar”.

## 2. Protección del estado local y Git

La auditoría comenzó con el árbol limpio en `main`. No había cambios locales que guardar o proteger. Se ejecutó `git fetch origin`, se creó la rama local de seguimiento mediante `git switch --track origin/feature/SC-UI-catalogos-cotizar`, y se comprobó el SHA.

`git merge-tree --write-tree origin/main HEAD` terminó con código 0, sin conflictos, y produjo el árbol calculado `90b10c3f0754eb71fa91c604faffab02ef70cbb2`. No se ejecutó merge, no se cambió main y no se creó un commit de fusión. Los hashes de main y origin/main permanecen en `41952b0`.

Las correcciones quedan como archivos modificados/nuevos de esta rama, sin stage ni commits. No se hizo stash, reset, eliminación de ramas, publicación de comentarios ni creación de otro PR.

## 3. Módulos analizados

### Laravel

Se revisaron controladores de autenticación, perfil, pedidos, cotización, reportes y valoraciones; controladores administrativos de resumen, pendientes, clientes, pedidos, reportes y moderación; modelos, formatos de respuesta, servicio Cotizador, migraciones, seeders, rutas, gates y validaciones. Se comprobó la sintaxis de 47 archivos PHP modificados por el PR o añadidos en la revisión.

Se contrastaron permisos, pertenencia de pedidos/reportes/valoraciones, exclusión de contraseñas en JSON, consentimiento legal, estados, cálculo de precios desde la base, validación de importes y contratos consumidos por los dos frontends.

### Vue

Dashboard, clientes y perfil individual, pedidos, catálogos/tarifas, zonas por departamento, reportes y moderación de valoraciones; router, sesión, Axios, utilidades, pruebas y dependencias. Las consultas observadas usan `/api/admin/*` y los endpoints de catálogos, no muestras estáticas. Los usos de v-html revisados corresponden a dibujos SVG definidos por el código, no a descripciones arbitrarias de clientes.

### Ionic

Inicio y opiniones públicas, categorías, materiales/tamaños, selección de departamentos/zonas, cotizador, agenda/pedido, registro/login, términos/privacidad, pedidos activos/historial, perfil, tema oscuro, reportes y valoraciones. Se contrastaron servicios HTTP, guards, manejo de sesión y modelos de presentación con las respuestas reales.

## 4. Hallazgos y correcciones

| Gravedad | Hallazgo | Corrección local |
| --- | --- | --- |
| Crítica | `/register` modificaba una cuenta Cliente sin contraseña y emitía acceso únicamente por conocer el correo. Eso permitía acceder al historial ligado a esa cuenta. | Primera solicitud devuelve 202 sin acceso ni mutaciones; código temporal enviado al correo; activación solo después de verificarlo bajo bloqueo transaccional. |
| Alta | ZonasCoberturaSeeder sobrescribía recargos, reactivaba zonas y desactivaba cualquier zona fuera de su lista. | Inserta solamente zonas inexistentes; conserva recargos, estado e identificadores de zonas existentes, antiguas y personalizadas. |
| Alta | TarifasItemsSeeder tenía el mismo patrón de sobrescritura de precios/visibilidad y desactivación de tarifas ajenas a su catálogo. | Solo inserta tarifas faltantes y conserva configuraciones administrativas y tarifas personalizadas. |
| Media | Perfil Ionic mantenía valoraciones/reportes fijos en null aunque el PR ya implementaba esos endpoints. | Lee `/mis-reportes` y `/mis-valoraciones`; muestra cantidades reales, sin sustituirlas por datos ficticios. Limpia métricas/direcciones al reentrar y evita aplicar respuestas de otro usuario. |
| Media | La prueba Ionic de correspondencia de zonas dependía del nombre `$vigentes`, un detalle auxiliar del seeder. Al eliminarlo, leía cadenas adicionales. | Extrae solamente el arreglo `$niveles`; conserva las comprobaciones de 44 nombres, ausencia de duplicados y correspondencia con los departamentos/distritos. |
| Operativa/seguridad | Un transporte de correo `log` podría guardar un código de activación en disco, y `array` no lo entrega al titular. | Ambos transportes se rechazan con 503 para reclamaciones; la cuenta queda intacta. No hay un bypass de seguridad basado en APP_ENV=testing. Los tests configuran SMTP y sustituyen el transporte cuando corresponde. |

### Reclamación de cuentas

- El código usa el cifrado autenticado de Laravel, contiene ID de cuenta, hash del correo y caducidad de 30 minutos. No se devuelve en JSON ni se imprime en los comandos.
- La solicitud inicial no cambia nombre, teléfono, hash, consentimiento ni pedidos. No entrega token Sanctum.
- Confirmar requiere repetir el registro con `claim_token` recibido en el correo. Se comprueban cuenta, correo, integridad y tiempo. Una cuenta Administrador o que ya tenga contraseña no puede reclamarse.
- Se mantiene el hash de contraseña de Usuario y la prohibición de enviar rol o password_hash desde el cliente.
- La activación configura la contraseña elegida en ese formulario, revoca tokens antiguos y emite uno nuevo. Al quedar la cuenta configurada, el código ya no puede reutilizarse.
- Se limita el reenvío a una vez por minuto por cuenta, además del límite general de registro. Envíos repetidos no modifican la cuenta.
- Ionic muestra el paso de código sin crear una sesión prematuramente y elimina el código del formulario al salir.
- El aviso del panel sobre una cuenta sin acceso ahora indica que debe verificarse el correo.

No se agregó una migración para esta solución. La condición de cuenta sin contraseña y el bloqueo de su fila hacen que la activación sea de un solo uso dentro de este flujo; el contenido cifrado no se guarda como un token público en la base.

Referencias: [cifrado autenticado Laravel](https://laravel.com/docs/12.x/encryption), [correo Laravel](https://laravel.com/docs/12.x/mail).

## 5. Archivos corregidos y añadidos

Modificados:

- `Api-Rest/app/Http/Controllers/Api/AuthController.php`
- `Api-Rest/database/seeders/ZonasCoberturaSeeder.php`
- `Api-Rest/database/seeders/TarifasItemsSeeder.php`
- `Api-Rest/tests/Feature/AuthApiTest.php`
- `Api-Rest/tests/Feature/PresentacionCatalogoTest.php`
- `Api-Rest/API.md`
- `swiftsite-admin/src/utils/clientes.ts`
- `swiftsite-ionic-angular/src/app/core/auth.service.ts`
- `swiftsite-ionic-angular/src/app/pages/auth/auth.page.ts`
- `swiftsite-ionic-angular/src/app/pages/auth/auth.page.html`
- `swiftsite-ionic-angular/src/app/pages/account/account.page.ts`
- `swiftsite-ionic-angular/tests/zonas.test.mjs`

Nuevos:

- `Api-Rest/app/Mail/ReclamarCuenta.php`
- `Api-Rest/resources/views/mail/reclamar-cuenta.blade.php`
- `Api-Rest/tests/Feature/ZonasSeederTest.php`
- `Api-Rest/scripts/review-pr4-mysql.php`
- `Api-Rest/scripts/review-pr4-browser.mjs`
- `REVISION_PR4.md`

Los archivos de preparación de servidores, buzón local y fixtures se encuentran bajo `Api-Rest/.github-prep/pr4/`, excluido de Git. No contienen datos reales ni deben subirse. No se reemplazaron diseños ni funcionalidades por mocks.

## 6. Pruebas Laravel

| Comando | Resultado real |
| --- | --- |
| `php artisan optimize:clear` con configuración existente | Falló al limpiar cache: MySQL real 127.0.0.1:3306 rechazó la conexión. No se informó como aprobado. |
| `php artisan migrate:status` con configuración existente | Falló por el mismo servicio no disponible. No se ejecutaron migraciones sobre esa base. |
| `php artisan route:list --path=api --json` | Aprobado, 48 rutas. |
| `php artisan test --no-ansi` inicial | 92 pruebas, 732 aserciones aprobadas; incluía una prueba que aceptaba la reclamación insegura. |
| `php artisan test --no-ansi` final | **97 pruebas y 762 aserciones aprobadas**. |
| `php -l` sobre archivos PHP cambiados/nuevos | 47 archivos aprobados. |
| Laravel Pint sobre archivos de corrección | Formato corregido/verificado. No se reformatearon todos los módulos del PR. |
| `git diff --check` | Aprobado. |

Las regresiones añadidas comprueban: ausencia de acceso/cambios antes de verificar, código alterado o vencido, correo distinto, repetición, protección Administrador, reenvío limitado, transporte log rechazado, revocación de tokens previos, conservación de zonas antiguas/personalizadas/inactivas y conservación de precios/visibilidad de tarifas.

La suite PHPUnit utiliza SQLite en memoria como antes. No sustituye la prueba MySQL descrita a continuación ni cambia el motor de la aplicación.

## 7. Migraciones, persistencia y seeders en MySQL aislado

Se creó un directorio de datos MariaDB totalmente separado en `.github-prep/pr4/mysql-data`, con un servidor enlazado solo a 127.0.0.1:3307. Nunca se usó el directorio de datos del servidor real ni su base para fixtures.

`php scripts/review-pr4-mysql.php` tiene una protección que exige comprobar el directorio de datos aislado antes de crear su base `pr4_review_*`. No permite utilizar el servidor configurado en el .env real.

Resultado: **44 comprobaciones aprobadas**, incluidas:

1. Migraciones del esquema base de main en una base nueva aislada.
2. Inserción de fixtures que representan una instalación existente, con textos, precios y estados editados.
3. `php artisan migrate` del PR sobre ese esquema: correcto, sin pérdida de esos fixtures.
4. Segunda ejecución de migrate: correcta, sin tablas/columnas duplicadas.
5. migrate:status y optimize:clear correctos dentro del entorno aislado.
6. Claves foráneas de usuarios, pedidos, reportes y valoraciones conservadas.
7. Ejecución repetida de seeders sin alterar precios ni visibilidad editados.
8. Registro y login Cliente y Administrador, credenciales incorrectas y rechazo de Cliente en todos los módulos administrativos consultados.
9. Catálogos, cotización, creación y consulta de pedidos, cambio de estados, reporte, valoración y publicación moderada persistidos en MariaDB.
10. Reclamación verificada, rechazo de repetición y logout que invalida el token.

En este runner el correo usa un fake de pruebas. Para comprobar el transporte real se utilizó además SMTP local con navegador, descrito abajo. Las bases aisladas conservan únicamente fixtures ficticios; no se borraron ni reiniciaron bases existentes.

Las cinco migraciones nuevas del PR fueron revisadas. No fue necesario alterarlas para subir desde main. El down de la migración que permite correo null transforma los correos null antes de volver a NOT NULL; no se ejecutó sobre datos reales ni se recomienda hacer downgrade sin revisar ese efecto.

## 8. Pruebas Vue y dependencias

Desde `swiftsite-admin`:

| Comando | Resultado |
| --- | --- |
| `npm.cmd ci` | Correcto, dependencias instaladas según lockfile. |
| `npm.cmd test` | **66 pruebas aprobadas**. Se repitió después de los cambios. |
| `npm.cmd run build` | Correcto, incluye vue-tsc y build Vite. Se repitió al final. |
| `npm.cmd ls @tailwindcss/vite --depth=0` | Instalado `@tailwindcss/vite@4.3.3`. |

No se añadieron dependencias ni se modificaron lockfiles para forzar una compilación. Los endpoints utilizados por dashboard, clientes, pedidos, zonas, reportes y valoraciones se contrastaron con las rutas del backend y se observaron en navegador contra datos reales aislados.

## 9. Pruebas Ionic

Desde `swiftsite-ionic-angular`:

| Comando | Resultado |
| --- | --- |
| `npm.cmd ci` | Correcto. npm mostró avisos de deprecación en tar/uuid/glob y de scripts de instalación no cubiertos; no se hicieron actualizaciones forzadas. |
| `npm.cmd test` inicial | 87 pruebas aprobadas. |
| `npm.cmd test` después de cambiar el seeder | Una prueba falló por depender de `$vigentes`; se corrigió su extracción del arreglo, sin eliminar comprobaciones. |
| `npm.cmd test` final | **87 pruebas aprobadas**. |
| `npm.cmd run build` | Compilación Angular de desarrollo correcta. |
| `npm.cmd run ionic:build` final | Compilación Angular de producción correcta, con las correcciones del formulario y perfil. |

El script usa Node test runner, no watch. Por ello no se pasó `--watch=false`, que no es una opción de esa suite. No se generó APK ni se instaló Android Studio.

## 10. Integración real en navegador

`node scripts/review-pr4-browser.mjs` completó **30 comprobaciones aprobadas** en Edge headless. Vue se ejecutó en 5173, Ionic en 8101 y Laravel en 8000 con variables de proceso apuntando exclusivamente a MariaDB aislado 3307. Se configuró CORS para esos orígenes de prueba sin editar el .env real.

No se interceptaron ni simularon respuestas de API. Se verificaron:

- Guard administrativo, contraseña incorrecta, rechazo de Cliente y login de Administrador.
- Dashboard desde `/admin/resumen`, clientes/perfil individual, pedidos, catálogos, zonas, reportes y valoraciones con sus endpoints reales.
- Recarga y verificación de la sesión administrativa.
- Inicio Ionic desde categorías y valoraciones públicas, selección de material/tamaño y total calculado por Laravel con zonas/departamentos.
- Términos y privacidad renderizados.
- Guard de cliente, perfil que consulta reportes/valoraciones y cambio a modo oscuro.
- Creación de pedido desde la interfaz de Ionic y persistencia en la base aislada; pedidos activos e historial.
- Formularios de reporte y valoración enviados correctamente sobre pedidos propios finalizados.
- Respuesta de reclamación pendiente sin sesión y posterior activación desde el formulario utilizando el código recibido por SMTP.
- Ausencia de excepciones JavaScript sin capturar en las páginas comprobadas.

Para el correo se inició un buzón SMTP local aislado en 1025, con consulta exclusiva de prueba en 1026. Recibió el mensaje generado por Laravel y permitió introducir el código en Ionic. Los mensajes/códigos solo existieron en RAM, no se escribieron en logs ni se enviaron a direcciones reales. Esto prueba el transporte SMTP y el flujo completo local; **no certifica la entregabilidad de un proveedor externo**.

Los runners de integración requieren preparar ese entorno aislado y fixtures nuevos. No deben ejecutarse apuntando a una instalación con datos reales. Los helpers locales de preparación no son configuración de despliegue del negocio.

## 11. Riesgos y condiciones pendientes

1. **Bloqueante para fusionar el PR remoto actual:** incorporar las correcciones locales a la rama del PR y revisar el nuevo SHA. El commit remoto auditado conserva el defecto crítico. No se hizo push automáticamente.
2. **Correo del entorno de uso:** configurar un proveedor SMTP o transporte real antes de habilitar reclamaciones. El modo log/array falla deliberadamente con 503. No se modificaron credenciales ni se comprobó un buzón externo.
3. **Base real no disponible durante la sesión:** migrate:status real no pudo ejecutarse. La compatibilidad fue comprobada sobre una copia de esquema creada con migraciones de main, no sobre un volcado de clientes. Antes del despliegue, iniciar el servicio real y revisar migraciones pendientes sin comandos destructivos.
4. Los textos legales tienen campos de negocio marcados como pendientes. Su responsable debe completarlos/revisarlos antes de publicar; no se inventaron datos de la empresa.
5. No se ejecutaron pruebas de carga/concurrencia masiva, auditoría de vulnerabilidades de todas las dependencias ni pruebas nativas Android/iOS. Los resultados aprobados no equivalen a certificar esas áreas.
6. La instancia de pruebas utiliza credenciales y usuarios exclusivamente ficticios, bases separadas y un buzón temporal. No deben desplegarse sus helpers ni puertos de depuración.

No se detectaron conflictos de Git ni fallos de compilación/pruebas que queden abiertos en la versión local corregida. No se modificaron datos reales, archivos .env, main, estados de Jira ni credenciales de clientes/administradores.

## 12. Acciones realizadas y siguiente revisión

Se terminó la corrección local y la verificación automatizada descrita. Se mantienen todos los módulos del PR y sus datos de API. El responsable puede revisar el diff local y decidir cómo registrar e incorporar los cambios, sin fusionar el commit vulnerable original.

El nuevo commit deberá evaluarse con las mismas suites y la configuración de correo/base del entorno destino. Este informe no autoriza un merge automático y no presenta resultados de servicios externos como si se hubieran ejecutado.
