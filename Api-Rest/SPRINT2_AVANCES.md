# SwiftSite Clean — Avances del Sprint 2

Fecha de verificacion: 27 de octubre de 2026. No se cambiaron estados de Jira.

## Resultado y alcance

Se revisaron e integraron los tres proyectos existentes en `C:\Users\dream\Music\SwiftSite Clean`: `Api-Rest`, `swiftsite-admin` y `swiftsite-ionic-angular`. Se mantuvieron Laravel/MySQL, Vue administrativo e Ionic Angular exclusivo para clientes. No se reinstalaron dependencias, no se recrearon tablas y no se modificaron archivos `.env` ni credenciales existentes.

Implementado: autenticacion cliente, navegacion de los dos frontends, proteccion por rol, servicios HTTP, cotizacion preliminar del servidor, CORS para ambos consumidores y evidencias automatizadas. La landing, fotografias, comparador y navegacion de privacidad de Ionic se conservaron. Se mantiene el numero de WhatsApp de ejemplo por indicacion del usuario.

## Auditoria inicial

| Componente | Version instalada comprobada |
| --- | --- |
| Laravel | 12.70.1 |
| Angular | 19.2.25 |
| Ionic Angular | 8.8.19 |
| Capacitor | 7.6.9 |
| Vue | 3.5.44 |
| Vite del Back Office | 8.3.5 |
| Pinia | 4.1.0 |
| Node de esta maquina | 26.5.0 |

Las migraciones y modelos ya configuraban claves primarias personalizadas, relaciones y ausencia de timestamps. MySQL estaba conectado; las siete tablas del negocio y `personal_access_tokens` existian. Se verificaron InnoDB, claves foraneas y campos monetarios DECIMAL(10,2) contra el esquema real.

La autenticacion Sanctum, el login Vue y el CRUD de catalogos ya existian; se extendieron sin reconstruirlos. Faltaban la cotizacion preliminar, el dashboard y la navegacion administrativa, y toda la integracion HTTP/autenticacion de Ionic. La configuracion CORS solo contemplaba Vue.

Los scripts Ionic ya habian sido corregidos para invocar `ng serve` y `ng build` directamente. Se hizo explicito el puerto 8100 y `--open=false`. El intento de iniciar en 8100 encontro una instancia existente; esta respondio HTTP 200. Se inicio ademas una instancia aislada en 8101, que compilo y atendio las pruebas sin abrir ventanas.

`User.php`, su factory y la migracion inicial `users` son remanentes del scaffold Laravel, conservados para no eliminar trabajo existente. El proveedor de autenticacion activo utiliza `Usuario`. Tambien existe un artefacto local `swiftsite_clean/swiftsite_clean`; no se uso como base ni se modifico. No se detectaron instrucciones AGENTS.md aplicables.

Node 26 compilo los proyectos, pero no pertenece a las versiones soportadas por Angular 19. Se agrego `.nvmrc` con la rama 22; usar Node 22.18 o posterior de esa rama satisface tambien el requisito del Back Office. Referencia: [compatibilidad oficial de Angular](https://angular.dev/reference/versions). No se cambio la instalacion de Node de la maquina.

## Evidencias por historia y subtarea

| Historia / subtarea | Avance y evidencia | Limite |
| --- | --- | --- |
| SC-16 / SC-19 — Ionic y Capacitor | Scripts sin recursion, arranque Angular en 8101, HTTP 200 en 8100, compilacion de produccion, TypeScript y cuatro pruebas de datos aprobados. `cap --version`: 7.6.9. | `cap ls` informa que no se pueden listar plugins para web; no hay plataforma nativa agregada. No se genero APK ni se instalo Android Studio. |
| SC-16 / SC-20 — Vue 3 | Se conservaron Vue Router, Pinia y Axios. Compilacion Vite y type-check aprobados. Dashboard y navegacion administrativa preparados. | Los modulos completos son Sprint 4. |
| SC-17 / SC-21 — Migraciones MySQL | Se verificaron las tablas existentes, motores transaccionales, claves foraneas y DECIMAL(10,2) usando information_schema y el schema builder. | No se ejecutaron migraciones destructivas ni se recreo el esquema. |
| SC-17 / SC-22 — Seeders | Se revisaron los seeders existentes y sus referencias. Los catalogos sembrados se consultaron desde ambos navegadores. | No se volvieron a ejecutar para evitar sobrescribir precios, recargos o estados existentes. |
| SC-18 / SC-23 — Login/registro Ionic | Formularios conectados a Laravel, registro exclusivo Cliente, login `portal=cliente`, perfil y logout. Pruebas de navegador y autenticacion con fixtures reales en MySQL aprobadas. | Las pruebas de UI usan respuestas sinteticas para no crear cuentas permanentes; las pruebas de backend usan MySQL con rollback. |
| SC-18 / SC-24 — Login administrativo | Login `portal=administrador`, rechazo de Cliente, `/dashboard` protegido y sesion verificada con `/me` al navegar/recargar. Logout revoca el token actual. | No se cambiaron ni se solicitaron las credenciales del administrador existente; la prueba MySQL usa un administrador temporal. |
| SC-18 / SC-25 — Interceptores y rutas | Axios centralizado en Vue; HttpClient, interceptor y guard de Cliente en Ionic. Tokens limitados a la API, errores JSON, timeout, 401/403 y control de rol del servidor. | Los guards de UI complementan la autorizacion Laravel; no la sustituyen. |
| SC-26 / SC-27 — Laravel y MySQL | Conexion real al driver mysql aprobada. Modelos Eloquent operativos y autenticacion con Usuario/correo/password_hash. | No se toco `.env`. |
| SC-26 / SC-28 — Endpoints REST | Se preservaron `/api/categorias`, `/api/tarifas`, `/api/zonas`, `/api/register`, `/api/login`, `/api/me`, `/api/user`, `/api/logout` y las escrituras administrativas. Se agrego `POST /api/cotizaciones/preliminar`. | Cotizar no crea pedidos ni implementa confirmacion, agenda o seguimiento. |
| SC-26 / SC-29 — CORS, pruebas y documentacion | CORS para Vue, Ionic web y origenes Capacitor; 20 tests Laravel, integracion MySQL, cuatro tests Ionic y 22 comprobaciones de navegador aprobadas. API.md y documentacion de ambos frontends actualizados. | La compilacion nativa Android no se ejecuto y no forma parte de este sprint. |

Esta tabla documenta evidencias para revision; no modifica ni afirma conocer otros criterios de aceptacion de Jira no proporcionados en la solicitud.

## API y reglas de seguridad

- Registro siempre asigna Cliente y rechaza campos de rol o password_hash suministrados por el consumidor.
- Login acepta `portal` opcional (`administrador` o `cliente`); credenciales incorrectas: 401; rol incompatible: 403 sin emitir token. Se conserva compatibilidad con clientes que omiten `portal`.
- Tokens Sanctum con expiracion de siete dias, contrasenas hasheadas, hash oculto en JSON, limites de intentos y revocacion en logout.
- POST/PUT/PATCH/DELETE de catalogos siguen protegidos por `auth:sanctum` y el gate `administrar-catalogos`; el rol se consulta en la base de datos.
- Los catalogos son publicos. Las pantallas administrativas de clientes/pedidos son estructura declarada, sin exponer informacion privada ni simular endpoints que no existen.
- Cotizacion valida zona, categoria y tarifa activas; cantidades enteras 1–10000, hasta 100 tarifas distintas. Rechaza importes del cliente y calcula en centavos enteros con precios/recargos de MySQL. Devuelve importes con dos decimales y no inserta pedidos.
- CORS conserva `ADMIN_ALLOWED_ORIGINS` y agrega `CLIENT_ALLOWED_ORIGINS`; no requiere modificar `.env` para los puertos predeterminados. No se habilitaron credenciales por cookies.

Ejemplo de cotizacion:

```json
{"id_zona":1,"items":[{"id_tarifa":1,"cantidad":3}]}
```

Respuesta: `preliminar`, `id_zona`, `items`, `subtotal`, `recargo_zona`, `total`. Los identificadores deben existir en la base configurada.

## Pruebas ejecutadas

| Verificacion | Resultado observado |
| --- | --- |
| `php artisan test --no-ansi` | 20 pruebas aprobadas, 137 aserciones. Incluyen autenticacion, roles, revocacion, expiracion, CORS, catalogos, cotizacion exacta, importes manipulados, cantidades, inactivos y desbordamiento. |
| `php scripts/verify-sprint2.php` | Aprobado contra MySQL real. Comprueba esquema, consultas Eloquent, registro/login de Cliente, login de Administrador, 401/403, escrituras autorizadas, cotizacion y logout. Fixtures y tokens se revierten en una transaccion; no quedan usuarios de prueba. |
| `npm.cmd test` en Ionic | 4 pruebas aprobadas: numeros invalidos, URL/mensaje WhatsApp, fotografias existentes y codificacion de rutas. |
| `npm.cmd run type-check` en Ionic | Aprobado. |
| `npm.cmd run ionic:build` | Produccion aprobada sin errores de compilacion. |
| `npm.cmd run build` en Vue | Vite y vue-tsc aprobados. |
| `node scripts/browser-sprint2.mjs` | 22 comprobaciones aprobadas en Edge headless. No se observaron excepciones JavaScript sin capturar. |
| Arranque de servidores | Laravel existente en 8000 e Ionic existente en 8100: HTTP 200. Vue iniciado y operativo en 5173; instancia Ionic aislada iniciada y operativa en 8101. |
| `npx.cmd --no-install cap --version` | 7.6.9. |
| `npx.cmd --no-install cap ls` | Comando ejecutado: informa que la lista de plugins para web no esta disponible. No equivale a una prueba Android. |

Los tests PHPUnit existentes usan SQLite en memoria como fixture aislado. No se cambio MySQL de la aplicacion. Para evitar confundir esa suite con integracion productiva, se agrego y ejecuto ademas la comprobacion transaccional especifica contra MySQL.

Las pruebas del navegador de autenticacion usan respuestas API sinteticas: login administrativo, password incorrecto, rechazo Cliente, dashboard sin sesion, recarga, catalogos, zonas, logout, registro y login Ionic, rechazo Administrador en Ionic, guard de Perfil, modo invitado, cotizacion, Pedidos identificado como pendiente y token invalido. La prueba simula la API, no el motor Vue/Angular ni el navegador.

Separadamente, el mismo navegador realiza peticiones reales desde Vue (5173) e Ionic (8100) a Laravel (8000): lectura de categorias/tarifas/zonas y POST de cotizacion preliminar contra MySQL. Estas dos comprobaciones no interceptan ni simulan las respuestas y comprueban CORS real.

Durante el diagnostico, PowerShell bloqueo los wrappers npm.ps1/npx.ps1; se usaron npm.cmd/npx.cmd sin cambiar la politica de ejecucion. La consulta de usuario de Windows de Capacitor fallo dentro del entorno restringido y se verifico correctamente fuera de el. Los puertos de usuario existentes no fueron terminados para realizar las pruebas.

Al finalizar se cerraron Edge headless y los dos servidores temporales de verificacion (Vue 5173 e Ionic 8101). Se conservaron las instancias originales de Laravel 8000 e Ionic 8100. Los resultados de arranque de la tabla corresponden a las pruebas realizadas, no a servidores que se prometan dejar ejecutandose.

## Archivos creados y modificados en esta ejecucion

### Api-Rest

Nuevos:

- `app/Http/Controllers/Api/CotizacionController.php`
- `tests/Feature/CotizacionApiTest.php`
- `scripts/verify-sprint2.php`
- `scripts/browser-sprint2.mjs`
- `scripts/start-sprint2-checks.ps1`
- `SPRINT2_AVANCES.md`

Modificados:

- `app/Http/Controllers/Api/AuthController.php`
- `routes/api.php`
- `config/cors.php`
- `tests/Feature/AuthApiTest.php`
- `tests/Feature/AdminCorsTest.php`
- `API.md`
- `.gitignore` (excluye directorios temporales de preparacion y perfil de navegador)

Los modelos, migraciones, seeders y datos existentes se inspeccionaron y conservaron.

### swiftsite-admin

Nuevos:

- `.nvmrc`
- `SPRINT2.md`
- `src/views/AdminLayout.vue`
- `src/views/DashboardView.vue`
- `src/views/PendingView.vue`

Modificados:

- `README.md`
- `src/router/index.ts`
- `src/stores/auth.ts`
- `src/views/CatalogosView.vue`

Se conservaron Axios, Pinia, LoginView, App.vue y sus estilos existentes. Dashboard, Pedidos, Catalogo/tarifas, Zonas y Clientes son rutas administrativas protegidas.

### swiftsite-ionic-angular

Nuevos:

- `.nvmrc`
- `SPRINT2.md`
- `src/environments/environment.ts`
- `src/app/core/session.service.ts`
- `src/app/core/api.interceptor.ts`
- `src/app/core/auth.service.ts`
- `src/app/core/auth.guard.ts`
- `src/app/core/catalogos.service.ts`
- `src/app/pages/auth/auth.page.ts`
- `src/app/pages/shell/shell.page.ts`
- `src/app/pages/account/account.page.ts`
- `src/app/pages/quote/quote.page.ts`

Modificados:

- `package.json`
- `README.md`
- `src/main.ts`
- `src/global.scss`
- `src/app/app.routes.ts`
- `src/app/pages/privacy/privacy.page.ts` (describe los formularios y la sesion que ahora existen)

Las copias temporales de preparacion estan excluidas por .gitignore; los cambios estan aplicados a los proyectos reales, no solo a esas copias.

## Comandos para ejecutar los proyectos

En tres terminales PowerShell distintas:

```powershell
cd 'C:\Users\dream\Music\SwiftSite Clean\Api-Rest'
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
cd 'C:\Users\dream\Music\SwiftSite Clean\swiftsite-admin'
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

```powershell
cd 'C:\Users\dream\Music\SwiftSite Clean\swiftsite-ionic-angular'
npm.cmd run dev
```

URLs: API `http://127.0.0.1:8000/api`; Back Office `http://127.0.0.1:5173/dashboard`; Ionic `http://localhost:8100/#/inicio`. Si un puerto ya esta ocupado, utilizar la instancia existente o elegir otro puerto y actualizar los origenes CORS correspondientes. No iniciar servidores duplicados en el mismo puerto.

Vue configura su API con `VITE_API_URL`. Ionic usa `src/environments/environment.ts`. En emulador Android, localhost corresponde al emulador: usar `10.0.2.2` para el host; en dispositivo fisico usar una URL alcanzable, preferiblemente HTTPS. No se implemento acceso directo a MySQL desde ningun frontend.

Comprobaciones desde Api-Rest:

```powershell
php artisan test --no-ansi
php scripts/verify-sprint2.php
```

`verify-sprint2.php` exige MySQL y tablas InnoDB. No ejecuta migraciones ni borrados: crea fixtures dentro de una transaccion y la revierte. Sus comprobaciones pueden consumir valores de autoincremento, aunque no persisten registros.

El runner de navegador requiere un navegador Chromium con depuracion local en 9223 y los frontends en 5173/8101; `scripts/start-sprint2-checks.ps1` inicia procesos de prueba ocultos y guarda sus IDs en `.sprint2/checks/processes.json`. Tambien requiere las instancias reales de API en 8000 e Ionic en 8100 para las comprobaciones sin mocks. No utiliza contrasenas ni tokens reales.

## Alcance pendiente y limites

- Sprint 3: cotizador completo, creacion/confirmacion y seguimiento de pedidos. La estimacion de este sprint consulta un servicio desde Ionic y admite multiples items en la API.
- Sprint 4: gestion administrativa completa de pedidos, clientes y catalogos. Se preservo el CRUD Laravel ya existente y la consulta Vue; no se construyeron formularios de gestion adicionales.
- Android: proyecto nativo, politicas de transporte, dispositivo/emulador y APK no se ejecutaron ni se certifican en este sprint.
- WhatsApp: sigue `503XXXXXXXX`, sin enlace operativo, por instruccion expresa del usuario.
- Las credenciales del administrador existente no se probaron manualmente ni se cambiaron. La autenticacion real se comprobo con fixtures temporales en MySQL.
- Despliegue: ajustar dominios HTTPS, URL de API, CORS y fallback a index.html para Vue Router segun el alojamiento final. No se publico ni desplego nada.

Referencias tecnicas: [Laravel Sanctum](https://laravel.com/docs/12.x/sanctum), [navegacion Ionic Angular](https://ionicframework.com/docs/angular/navigation), [flujo de Capacitor](https://capacitorjs.com/docs/basics/workflow).
