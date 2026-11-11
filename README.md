# SwiftSite Clean

Sistema de servicios de limpieza a domicilio. Este monorepositorio reúne la API central y las dos aplicaciones que la consumen, con el objetivo de compartir una instalación reproducible y colaborar mediante ramas y Pull Requests.

| Proyecto | Propósito | Tecnologías |
| --- | --- | --- |
| `Api-Rest` | API REST, reglas del negocio y acceso a datos | Laravel 12, PHP, Eloquent, Sanctum, MySQL |
| `swiftsite-admin` | Back Office exclusivo para administradores | Vue 3, Vite, TypeScript, Pinia, Axios |
| `swiftsite-ionic-angular` | Aplicación de clientes y modo invitado | Ionic 8, Angular 19, TypeScript, Capacitor 7 |

Los frontends se comunican con Laravel mediante HTTP/JSON. Solo Laravel accede a la base de datos. Consulta [Arquitectura](docs/ARQUITECTURA.md), [base de datos](docs/BASE_DATOS.md), [configuración](docs/CONFIGURACION_LOCAL.md) y [colaboración](CONTRIBUTING.md).

```text
.
├── Api-Rest/
├── swiftsite-admin/
├── swiftsite-ionic-angular/
├── docs/
├── .gitignore
├── .gitattributes
├── README.md
├── CONTRIBUTING.md
└── SwiftSite Clean.bat
```

## Requisitos

- PHP 8.2 o superior compatible con `composer.lock`, con PDO MySQL, PDO SQLite para tests y las extensiones requeridas por Laravel: Ctype, cURL, DOM, Fileinfo, Filter, Hash, Mbstring, OpenSSL, PCRE, Session, Tokenizer y XML. La comprobación final corresponde a Composer.
- Composer 2. Comprobar `composer --version` y, después de instalar, `composer check-platform-reqs`.
- MySQL con soporte de CHECK constraints (MySQL 8.0.16 o superior). El entorno auditado utiliza MariaDB 10.4.32 a través del driver `mysql`; no se cambió su motor. No se comparten bases locales ni dumps.
- Node.js **22.18 o posterior de la rama 22**, de acuerdo con `.nvmrc` de ambos frontends. Es la rama común compatible con Angular 19 y el requisito de Vue/Vite. Usar npm incluido con esa instalación.
- Git. Visual Studio Code es el editor recomendado.
- Angular CLI y Capacitor CLI ya son dependencias locales de Ionic. No se requiere Ionic CLI global para `npm run dev` ni Android Studio para ejecutar en navegador.
- Python 3 es opcional, únicamente para `audit-repository.py`.

Las versiones concretas se conservan en `composer.lock` y los tres `package-lock.json`. No usar `composer update` ni `npm update` para instalar el proyecto. Ver [compatibilidad Angular](https://angular.dev/reference/versions) y [requisitos Laravel](https://laravel.com/docs/12.x/deployment).

## Obtener el proyecto

Clona el repositorio con una cuenta que tenga acceso:

```bash
git clone https://github.com/xEdnsx/SwiftSiteCleantest.git swiftsite-clean
cd swiftsite-clean
```

El nombre local puede ser diferente; los proyectos no dependen de una ruta de usuario específica. El remoto del repositorio clonado se llama `origin`.

## Instalar Laravel

Comandos desde la raíz del monorepositorio. En PowerShell, usar `Copy-Item`; en Bash sustituirlo por `cp`.

```powershell
cd Api-Rest
composer install
Copy-Item .env.example .env
```

La copia es solo para una instalación nueva: **no sobrescribir un `.env` existente**. Crear una base MySQL vacía y un usuario local propio; completar `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT` en `.env`. El ejemplo no incluye una cuenta real ni privilegios de base de datos preconfigurados.

```powershell
php artisan key:generate
php artisan migrate
php artisan db:seed
composer check-platform-reqs
php artisan serve --host=127.0.0.1 --port=8000
```

Ejecutar seeders al inicializar la base nueva. Los seeders de zonas y tarifas insertan datos faltantes conservando los precios y estados administrativos existentes. No se usa `migrate:fresh`.

Verificar `http://127.0.0.1:8000/api/prueba` y `/api/categorias`. Los seeders crean roles y catálogos, **no una contraseña administrativa compartida**. Cada entorno debe aprovisionar su administrador mediante el proceso de confianza descrito en [configuración local](docs/CONFIGURACION_LOCAL.md).

La API no necesita compilar `resources/` para atender estos endpoints. `Api-Rest/package-lock.json` se conserva si se utiliza Vite del backend: en ese caso ejecutar `npm ci` y `npm run build` dentro de `Api-Rest`.

## Instalar el Back Office Vue

Desde la raíz, en otra terminal:

```powershell
cd swiftsite-admin
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Configurar `VITE_API_URL=http://127.0.0.1:8000/api` en el `.env` propio. Reiniciar Vite si cambia esa variable. No poner contraseñas ni claves en variables `VITE_*`: son públicas en el navegador.

Abrir `http://127.0.0.1:5173/dashboard`. Iniciar sesión con una cuenta local con rol `Administrador`. Un Cliente no puede acceder al Back Office.

```powershell
npm.cmd run type-check
npm.cmd run build
```

En macOS/Linux usar `npm` en lugar de `npm.cmd`. El resultado se genera en `dist/`, excluido de Git.

## Instalar Ionic Angular

Desde la raíz, en otra terminal:

```powershell
cd swiftsite-ionic-angular
npm.cmd ci
npm.cmd run dev
```

Antes de iniciar, comprobar `src/environments/environment.ts`: `apiUrl` debe apuntar al backend local. Abrir `http://localhost:8100/inicio`.

El script real es `ng serve --port 8100 --open=false`. No ejecuta `ionic serve` recursivamente ni abre ventanas automáticamente. No es necesario instalar Ionic CLI global.

```powershell
npm.cmd test
npm.cmd run type-check
npm.cmd run ionic:build
npx.cmd --no-install cap --version
```

El build de producción queda en `www/browser`, utilizado por `capacitor.config.ts`. Para Android Emulator, `127.0.0.1` apunta al emulador, no al equipo: configurar la API con `10.0.2.2`. En un dispositivo físico usar una URL alcanzable por la red o un dominio HTTPS; no guardar una dirección privada de un integrante como valor compartido. Más detalles en [configuración local](docs/CONFIGURACION_LOCAL.md).

## Puertos predeterminados

| Aplicación | Puerto |
| --- | --- |
| Laravel | 8000 |
| Vue | 5173 |
| Ionic | 8100 |
| MySQL | 3306 |

Todos son configurables. Si cambia el origen de un frontend, actualizar la lista CORS local de Laravel y ejecutar `php artisan config:clear`.

## Base de datos

| Tabla principal | Función |
| --- | --- |
| `roles` | Roles Cliente y Administrador |
| `usuarios` | Cuentas, contacto y hash de contraseña |
| `categorias_servicio` | Agrupaciones de servicios |
| `tarifas_items` | Tipos de ítems, materiales y precios |
| `zonas_cobertura` | Cobertura y recargos |
| `pedidos` | Datos y estado de pedidos; estructura para sprints posteriores |
| `detalle_pedidos` | Ítems y cantidades asociados a un pedido |

Además existen tablas de infraestructura de Laravel y `personal_access_tokens`. Los importes del negocio son `DECIMAL(10,2)` y las claves primarias tienen nombres personalizados. El esquema compartido se inicializa exclusivamente con migraciones y seeders; ver [BASE_DATOS.md](docs/BASE_DATOS.md).

## API REST implementada

Base local: `http://127.0.0.1:8000/api`. Enviar `Accept: application/json` y cuerpos JSON con `Content-Type: application/json`.

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/prueba` | Público |
| POST | `/register` | Público, crea Cliente |
| POST | `/login` | Público, con límite de intentos |
| GET | `/me`, `/user` | Token Sanctum |
| POST | `/logout` | Token Sanctum, revoca el actual |
| GET | `/categorias`, `/categorias/{id}` | Público |
| GET | `/tarifas`, `/tarifas/{id}` | Público |
| GET | `/zonas`, `/zonas/{id}` | Público |
| POST | `/categorias`, `/tarifas`, `/zonas` | Administrador autenticado |
| PUT/PATCH/DELETE | `/categorias/{id}`, `/tarifas/{id}`, `/zonas/{id}` | Administrador autenticado |
| POST | `/cotizaciones/preliminar` | Público, estimación sin crear pedidos |

El login recibe `correo`, `password` y opcionalmente `portal` (`administrador` o `cliente`). Devuelve un token Bearer válido por siete días. Los clientes lo envían en `Authorization: Bearer <TOKEN_LOCAL>`; no copiar un token real a código, commits o documentación.

Ejemplo de registro con datos ficticios, reemplazando la contraseña localmente:

```json
{
  "nombre": "Cliente de prueba",
  "correo": "cliente@example.invalid",
  "password": "CONTRASENA_LOCAL_DE_EJEMPLO",
  "password_confirmation": "CONTRASENA_LOCAL_DE_EJEMPLO",
  "acepta_terminos": true
}
```

Ejemplo de cotización; sustituir IDs por los de los catálogos de la base local:

```json
{"id_zona":1,"items":[{"id_tarifa":1,"cantidad":3}]}
```

Laravel valida los ítems y calcula los importes con precios de la base. No acepta totales calculados por el frontend. Documentación completa en [Api-Rest/API.md](Api-Rest/API.md).

## Pruebas

```powershell
# Dentro de Api-Rest
php artisan test
php artisan route:list --path=api

# Opcional: integración transaccional con MySQL local ya configurado
php scripts/verify-sprint2.php

# Desde la raíz: auditoría de los archivos candidatos al repositorio
python Api-Rest/scripts/audit-repository.py
```

La suite PHPUnit usa SQLite **solo en memoria y para pruebas**; no reemplaza la base MySQL de la aplicación. La verificación MySQL crea fixtures temporales y revierte su transacción, aunque puede consumir valores de autoincremento. Las pruebas de navegador adicionales y sus requisitos se describen en [CONFIGURACION_LOCAL.md](docs/CONFIGURACION_LOCAL.md).

## Solución de problemas

| Problema | Comprobación y solución |
| --- | --- |
| MySQL no está iniciado | Iniciar su servicio y comprobar host/puerto antes de ejecutar migraciones. |
| Laravel no conecta | Revisar `.env` local, base y permisos del usuario; habilitar PDO MySQL; ejecutar `php artisan config:clear`. No compartir la salida con credenciales. |
| CORS | Ajustar `ADMIN_ALLOWED_ORIGINS`/`CLIENT_ALLOWED_ORIGINS` al origen exacto del navegador; reiniciar o limpiar configuración. |
| Puerto ocupado | Reutilizar la instancia correcta o elegir otro puerto. No cerrar procesos de otros integrantes. |
| npm bloqueado en PowerShell | Utilizar `npm.cmd` y `npx.cmd`; no hace falta cambiar la política de ejecución. |
| ERR_CONNECTION_REFUSED | Confirmar que el servidor realmente inició y que la URL apunta al host y puerto correctos. Revisar la terminal por errores de compilación. |
| Dependencias faltantes | `composer install` o `npm ci` en la carpeta correspondiente. No copiar `vendor/` ni `node_modules/`. |
| Composer no funciona | Verificar `composer --version` y el PATH. Un wrapper que apunta a composer.phar inexistente requiere reparar Composer en esa máquina. |
| Ionic no inicia | Usar `npm.cmd run dev`, comprobar Node y el puerto 8100; evitar scripts que llamen a `ionic serve` desde `ionic:serve`. |
| Versión Node incompatible | Usar la rama 22, mínimo 22.18; consultar `.nvmrc` y reiniciar terminal/dependencias solo si es necesario. |
| API inaccesible desde Android | Ajustar URL para emulador/dispositivo, red, CORS y política de transporte nativa. La compilación web no certifica Android. |

## Estado y colaboración

El proyecto incluye autenticación Sanctum por rol, recuperación de contraseña por correo, catálogos, cotizaciones, pedidos y seguimiento, perfil, reportes y valoraciones, además de gestión administrativa. Solo el usuario con `id_usuario=1` y rol Administrador puede crear otros administradores. La creación inicial debe garantizar ese ID mediante el proceso de confianza de configuración local; el sistema no promueve automáticamente cuentas existentes.

WhatsApp conserva el número de ejemplo y está desactivado hasta configurarlo. Completar los datos legales del negocio antes de publicar. La compilación web no sustituye las pruebas en dispositivos Android/iOS.

- [Guía de contribución](CONTRIBUTING.md)
- [Flujo Git](docs/FLUJO_GIT.md)
- [Evidencias del Sprint 2](Api-Rest/SPRINT2_AVANCES.md)

Nunca versionar `.env`, bases de datos, dumps, tokens, claves privadas, logs ni dependencias instaladas. La revisión del primer commit debe comprobar también las exclusiones; un repositorio privado no sustituye esa revisión.


## Inicio con un clic en Windows y acceso por Wi-Fi

Después de instalar dependencias, configurar `.env`, generar APP_KEY y ejecutar migraciones, abre **SwiftSite Clean.bat** desde la raíz. El lanzador llama a `scripts/start-local.ps1`, comprueba herramientas, dependencias y puertos, y permite elegir:

- **1 — Local:** las aplicaciones solo escuchan en `127.0.0.1`.
- **2 — Red Wi-Fi:** escucha en `0.0.0.0`, detecta la IPv4 y muestra enlaces para clientes y administradores. Si hay varios adaptadores solicita elegir la IP.

También puedes ejecutar `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Mode lan` desde la raíz. La API, Vue y Ionic se inician en segundo plano; el lanzador muestra dónde consultar los logs temporales. Espera a que los frontends terminen de compilar. Pulsa Enter en el lanzador para detener sus tres servicios y procesos hijos.

El modo de red configura URL de API y CORS en los procesos sin editar `.env`; Ionic usa el hostname del navegador en los puertos de desarrollo 8100/4200. MySQL debe iniciarse previamente: el lanzador no instala dependencias, crea usuarios ni ejecuta migraciones. Si un puerto está ocupado, cierra el servidor anterior y vuelve a ejecutar. Permite TCP 8000, 5173 y 8100 únicamente en el perfil privado del firewall; todos deben estar en la misma red. La IP puede cambiar al reconectar el equipo.

Este es un entorno de desarrollo para una red de confianza. Para acceso por Internet utiliza un despliegue con HTTPS; no redirijas estos puertos desde el router.

## Correo y recuperación de acceso

En `Api-Rest/.env`, completa las variables SMTP de `.env.example`. Para Gmail usa tu correo completo y una contraseña de aplicación de Google con verificación en dos pasos habilitada. El remitente debe coincidir con la cuenta autorizada. No uses la contraseña habitual ni subas `.env` al repositorio.

Ejecuta `php artisan config:clear` y reinicia Laravel tras cambiar el correo. La recuperación y activación requieren SMTP disponible: no envían códigos usando `log` ni `array`. El código de recuperación caduca en 30 minutos, es de un solo uso y revoca las sesiones anteriores al cambiar la contraseña. Más detalles y endpoints en [API.md](Api-Rest/API.md).
