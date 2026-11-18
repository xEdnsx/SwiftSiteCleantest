# Guía Completa de Despliegue — SwiftSite Clean

Esta guía detalla el procedimiento paso a paso para desplegar en producción el ecosistema **SwiftSite Clean** utilizando exclusivamente niveles gratuitos (*free tiers*):
- **Base de datos:** TiDB Cloud Starter (protocolo MySQL, TLS activado).
- **Backend API:** Render Free Web Service (Docker con Apache + PHP 8.2 + Laravel 12).
- **Frontend Administrador:** Cloudflare Pages (Vue 3 + Vite).
- **Frontend Cliente:** Cloudflare Pages (Ionic 8 + Angular 19).

---

## 1. Requisitos Previos

- Cuenta en [GitHub](https://github.com) con el repositorio actualizado.
- Cuenta en [TiDB Cloud](https://tidbcloud.com) (Starter Tier gratuito).
- Cuenta en [Render](https://render.com) (Plan Free).
- Cuenta en [Cloudflare](https://dash.cloudflare.com) (Cloudflare Pages gratuito).
- Proveedor de correo SMTP (opcional pero requerido para recuperación de contraseña por email; e.g., Brevo, Mailersend, Gmail con contraseña de aplicación).

---

## 2. Preparación de TiDB Cloud (Base de Datos MySQL Remota)

1. Inicia sesión en **TiDB Cloud Console**.
2. Haz clic en **Create Cluster** y selecciona **Serverless / Starter** (Free Tier).
3. Selecciona tu región geográfica más cercana a la región de Render que elijas (por ejemplo `us-east-1` o `us-west-2`).
4. Define un nombre para el clúster (ej. `swiftsite-db`).
5. Tras completarse la creación, haz clic en **Connect**:
   - En el menú desplegable selecciona **Connect with: General Client / MySQL CLI**.
   - Genera o anota la contraseña segura del usuario `root` o del usuario creado por TiDB (los usuarios de TiDB suelen tener el prefijo del clúster, ej: `xxxx.root`).
   - Copia los datos de conexión:
     - **Host:** (ejemplo: `gateway01.us-east-1.prod.aws.tidbcloud.com`)
     - **Port:** `4000`
     - **User:** (ejemplo: `3JkX....root`)
     - **Password:** `<tu_contraseña>`
6. Abre el **Chat2Query** integrado en la consola de TiDB Cloud o conéctate con DBeaver/MySQL Workbench/CLI y ejecuta:
   ```sql
   CREATE DATABASE IF NOT EXISTS swiftsite_clean CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
7. Verifica que la base `swiftsite_clean` esté creada.

> **Nota sobre TLS/SSL:** TiDB Cloud requiere obligatoriamente conexiones seguras TLS. La configuración de `Api-Rest/config/database.php` y el contenedor Docker ya incluyen soporte para el CA bundle del sistema (`/etc/ssl/certs/ca-certificates.crt`), manteniendo la verificación activa sin deshabilitar la seguridad.

---

## 3. Configuración del Backend en Render (Docker)

1. En el panel de Render, haz clic en **New +** y selecciona **Web Service**.
2. Vincula tu repositorio de GitHub `SwiftSite Clean`.
3. Especifica los siguientes ajustes:
   - **Name:** `swiftsite-api` (o el nombre de tu preferencia).
   - **Region:** Selecciona la misma región de tu clúster TiDB (o la más cercana, ej: `Ohio (US East)` o `Oregon (US West)`).
   - **Root Directory:** `Api-Rest`
   - **Runtime:** `Docker`
   - **Instance Type:** `Free`
4. En la sección **Environment Variables**, añade las siguientes variables:

| Variable | Valor Recomendado / Descripción |
|---|---|
| `APP_NAME` | `"SwiftSite Clean"` |
| `APP_ENV` | `production` |
| `APP_KEY` | *(Genera una clave con `php artisan key:generate --show` o usa una de 32 bytes en base64: `base64:...`)* |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://swiftsite-api.onrender.com` *(reemplaza con tu URL real asignada por Render)* |
| `LOG_CHANNEL` | `stderr` |
| `LOG_LEVEL` | `error` (o `warning`) |
| `DB_CONNECTION` | `mysql` |
| `DB_HOST` | *(Host obtenido de TiDB Cloud)* |
| `DB_PORT` | `4000` |
| `DB_DATABASE` | `swiftsite_clean` |
| `DB_USERNAME` | *(Usuario obtenido de TiDB Cloud)* |
| `DB_PASSWORD` | *(Contraseña obtenida de TiDB Cloud)* |
| `ADMIN_ALLOWED_ORIGINS` | `https://admin.tudominio.pages.dev` *(URL asignada al panel Vue en Cloudflare)* |
| `CLIENT_ALLOWED_ORIGINS` | `https://app.tudominio.pages.dev,capacitor://localhost,http://localhost` *(URL asignada a la app Ionic)* |
| `SESSION_DRIVER` | `database` (o `file`) |
| `CACHE_STORE` | `database` (o `file`) |
| `QUEUE_CONNECTION` | `database` (o `sync`) |
| `FILESYSTEM_DISK` | `local` (o `s3` si configuras Cloudflare R2 / AWS S3) |
| `RUN_SEEDERS` | `true` *(Únicamente en el PRIMER despliegue; cambiar a `false` inmediatamente después)* |
| `LEGAL_VERSION` | `2026-11-08` |

*(Configuración de correo SMTP para recuperación de contraseñas)*
| Variable | Valor |
|---|---|
| `MAIL_MAILER` | `smtp` |
| `MAIL_HOST` | `smtp-relay.brevo.com` *(o tu servidor SMTP)* |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | `tu-usuario-smtp` |
| `MAIL_PASSWORD` | `tu-password-smtp` |
| `MAIL_ENCRYPTION` | `tls` |
| `MAIL_FROM_ADDRESS` | `notificaciones@tudominio.com` |
| `MAIL_FROM_NAME` | `SwiftSite Clean` |

5. Haz clic en **Create Web Service**.
6. Render construirá la imagen Docker, ejecutará `composer install --no-dev`, aplicará las migraciones (`php artisan migrate --force`), ejecutará los seeders no destructivos (`db:seed --force`) y arrancará Apache escuchando en el puerto dinámico `$PORT`.
7. **IMPORTANTE:** Una vez terminado el primer despliegue con éxito, edita las variables en Render y cambia `RUN_SEEDERS=false`.

---

## 4. Inicialización de los Administradores del Equipo (AdministradoresSeeder)

El proyecto incluye el seeder `AdministradoresSeeder`, integrado al final de `DatabaseSeeder.php`. Este seeder registra a los 5 integrantes oficiales del equipo:
1. `demianbucaro@gmail.com`
2. `sorianocamposedenilson@gmail.com`
3. `cab.brayan.com@gmail.com`
4. `franciscojavierortiz710@gmail.com`
5. `hailyaneth0106@gmail.com`

### Características de Seguridad del Seeder
- **Idempotente:** Si una cuenta ya existe en la base de datos, no genera una nueva contraseña ni sobrescribe sus datos.
- **Contraseñas Seguras e Independientes:** Genera contraseñas aleatorias únicas de 16 caracteres para cada cuenta creada.
- **Sin Texto Plano en BD:** Todas las contraseñas se almacenan mediante el hash nativo de Laravel (`bcrypt`).
- **Entrega Segura de Credenciales:**
  - Imprime las credenciales generadas en la consola de ejecución una única vez.
  - Guarda una copia local en `storage/app/private/admin-credentials-initial.json` (directorio privado excluido por `.gitignore`).
  - No imprime ni guarda contraseñas de cuentas que ya existían previamente.

### Procedimiento: Ejecución Local Conectada a TiDB Cloud
Dado que el nivel gratuito de Render Free no ofrece acceso interactivo por Shell (o este se reinicia rápidamente sin conservar archivos), el método más cómodo, seguro y reproducible para inicializar los administradores y obtener sus contraseñas iniciales es ejecutar el seeder **desde tu máquina local apuntando temporalmente a TiDB Cloud**:

1. En tu archivo local `Api-Rest/.env`, coloca temporalmente las credenciales de TiDB Cloud:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
   DB_PORT=4000
   DB_DATABASE=swiftsite_clean
   DB_USERNAME=xxxxxx.root
   DB_PASSWORD=tu_password_tidb
   ```
2. Ejecuta únicamente el seeder de administradores (o el seeder general completo):
   ```bash
   php artisan db:seed --class=AdministradoresSeeder
   ```
3. Observa la tabla de credenciales que se imprime en tu terminal:
   ```text
   +----+--------------------------+-----------------------------------+--------------------+
   | ID | Nombre                   | Correo                            | Contraseña Temporal|
   +----+--------------------------+-----------------------------------+--------------------+
   | 1  | Demian Búcaro            | demianbucaro@gmail.com            | a8f#K9xL2pQ!mZ4w   |
   | 2  | Edenilson Soriano Campos | sorianocamposedenilson@gmail.com  | b7g@M1vN8sT#kR3x   |
   | 3  | Brayan Cab               | cab.brayan.com@gmail.com          | c5h!P3wQ7rU$jS9y   |
   | 4  | Francisco Javier Ortiz   | franciscojavierortiz710@gmail.com | d2j$R4xS6tV%hT1z   |
   | 5  | Haily Aneth              | hailyaneth0106@gmail.com          | e9k%T5yU5uW&gU2a   |
   +----+--------------------------+-----------------------------------+--------------------+
   ```
4. También encontrarás el archivo `Api-Rest/storage/app/private/admin-credentials-initial.json` generado en tu máquina local.
5. **Entrega privada y cambio de contraseñas:**
   - Entrega a cada compañero su contraseña por un canal privado (mensaje directo seguro).
   - Solicita a cada integrante iniciar sesión en el panel Vue (`https://swiftsite-admin.pages.dev`) o mediante la API y actualizar su contraseña inmediatamente a una clave personal definitiva (o a través del flujo de recuperación de contraseña si el correo SMTP está activo).
   - Una vez repartidas las claves, elimina el archivo temporal `storage/app/private/admin-credentials-initial.json`.
6. Restablece tu archivo `Api-Rest/.env` a los valores de tu base de datos de desarrollo local.
7. Al desplegar en Render con `RUN_SEEDERS=true` en la primera ejecución, o si el contenedor se reinicia, el seeder detectará que los 5 correos ya existen y **no generará nuevas contraseñas ni alterará las cuentas**.

### Comprobación de Roles en la Base de Datos
Para verificar que los cinco integrantes tienen asignado el rol de Administrador, puedes consultar en la consola Chat2Query de TiDB Cloud:
```sql
SELECT u.id_usuario, u.nombre, u.correo, r.nombre_rol 
FROM usuarios u 
JOIN roles r ON u.id_rol = r.id_rol 
WHERE r.nombre_rol = 'Administrador';
```

---

## 5. Publicación del Panel Administrativo (Vue 3) en Cloudflare Pages

1. Inicia sesión en **Cloudflare Dashboard** > **Compute (Workers & Pages)** > **Create application** > **Pages** > **Connect to Git**.
2. Conecta tu repositorio `SwiftSite Clean`.
3. Configuración del proyecto:
   - **Project name:** `swiftsite-admin` (o el que elijas).
   - **Production branch:** `main`
   - **Framework preset:** `Vue` o `Vite` (o None).
   - **Root directory:** `swiftsite-admin`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. En **Environment variables (production)**, agrega:
   - `VITE_API_URL` = `https://swiftsite-api.onrender.com/api` *(la URL de tu Web Service en Render seguida de `/api`)*
5. Haz clic en **Save and Deploy**.
6. Cloudflare Pages compilará el panel administrativo. Al finalizar, te asignará un subdominio público (ej: `https://swiftsite-admin.pages.dev`).
7. El archivo `swiftsite-admin/public/_redirects` (copiado automáticamente a `dist/_redirects`) garantiza que cualquier ruta directa (ej: `/pedidos`, `/clientes`, `/catalogos`) se resuelva mediante `index.html` sin dar error 404.

---

## 6. Publicación de la Aplicación Cliente (Ionic + Angular) en Cloudflare Pages

1. En Cloudflare Dashboard > **Compute (Workers & Pages)** > **Create application** > **Pages** > **Connect to Git**.
2. Selecciona de nuevo el repositorio `SwiftSite Clean`.
3. Configuración del proyecto:
   - **Project name:** `swiftsite-client`
   - **Production branch:** `main`
   - **Framework preset:** `Angular` (o None).
   - **Root directory:** `swiftsite-ionic-angular`
   - **Build command:** `npm run ionic:build`
   - **Build output directory:** `www/browser` *(¡Atención! Este es el directorio exacto generado por Angular 19)*
4. En tu código de Angular, actualiza `swiftsite-ionic-angular/src/environments/environment.prod.ts` con la URL real de tu API Render:
   ```typescript
   export const environment = {
     apiUrl: 'https://swiftsite-api.onrender.com/api'
   };
   ```
   *(También puedes configurarlo para ser inyectado mediante variables si utilizas scripts de CI/CD)*.
5. Haz clic en **Save and Deploy**.
6. El archivo `_redirects` en `src/assets/_redirects` se compila hacia `www/browser/_redirects`, garantizando la navegación SPA sin errores 404 al recargar.

---

## 7. Cierre del Ciclo CORS

Una vez que Cloudflare Pages asigne los dominios definitivos (o configures dominios personalizados):

1. Ve a Render > Tu Web Service > **Environment**.
2. Actualiza:
   - `ADMIN_ALLOWED_ORIGINS`: `https://swiftsite-admin.pages.dev` (o tu dominio).
   - `CLIENT_ALLOWED_ORIGINS`: `https://swiftsite-client.pages.dev,capacitor://localhost,http://localhost`
3. Guarda los cambios. Render redespachará el contenedor automáticamente con las nuevas reglas CORS.

---

## 8. Verificaciones y Pruebas Posteriores al Despliegue

1. **Endpoint de Salud de la API:**
   Navega a `https://swiftsite-api.onrender.com/up`. Debe retornar código HTTP 200 (pantalla de salud estándar de Laravel 12).
2. **Endpoint de Prueba:**
   Navega a `https://swiftsite-api.onrender.com/api/prueba`. Debe responder en JSON:
   ```json
   { "mensaje": "API SwiftSite Clean funcionando", "estado": "correcto" }
   ```
3. **Catálogos Públicos:**
   Navega a `https://swiftsite-api.onrender.com/api/categorias?activo=1`. Debe retornar el listado de categorías inicializado por los seeders.
4. **Acceso al Panel:**
   Abre la URL de Cloudflare Pages del panel Vue. Inicia sesión con el correo y contraseña del Administrador creados en el Paso 4.
5. **Acceso a la App Cliente:**
   Abre la URL de Cloudflare Pages de la aplicación cliente. Realiza una cotización, regístrate como nuevo cliente y verifica la creación del pedido.
6. **Inspección de Encabezados de Red:**
   Abre las herramientas de desarrollador en el navegador (pestaña Network) y verifica que las peticiones `OPTIONS` (preflight CORS) respondan con código 200 o 204 y los encabezados `Access-Control-Allow-Origin` adecuados.

---

## 9. Almacenamiento de Archivos (Persistencia)

- El plan gratuito de Render utiliza un sistema de archivos efímero (se restablece en cada reinicio o nuevo despliegue).
- SwiftSite Clean almacena en este momento todos sus datos esenciales (cotizaciones, pedidos, usuarios, detalles, reportes y opiniones) directamente en la base de datos MySQL/TiDB.
- Las fotografías de muestra de servicios y comparativas están optimizadas y empaquetadas como assets estáticos del cliente en `swiftsite-ionic-angular/src/assets/fotos`.
- Para almacenar archivos subidos por usuarios en el futuro (ej. adjuntos de reportes):
  - Utiliza **Cloudflare R2** (nivel gratuito de 10 GB de almacenamiento y sin cobro por transferencia de salida).
  - Como Cloudflare R2 es compatible al 100% con la API de Amazon S3, simplemente añade en Render las variables:
    ```env
    FILESYSTEM_DISK=s3
    AWS_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
    AWS_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>
    AWS_DEFAULT_REGION=auto
    AWS_BUCKET=<NOMBRE_BUCKET_R2>
    AWS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    AWS_USE_PATH_STYLE_ENDPOINT=false
    ```

---

## 10. Procedimiento de Actualización (Nuevos Cambios y Git Push)

Cada vez que hagas `git push origin main`:

1. **Backend (Render):** Detectará el commit automáticamente, compilará la nueva imagen Docker, ejecutará `php artisan migrate --force` y sustituirá el contenedor en cero tiempo de inactividad visible.
2. **Frontend Admin (Cloudflare):** Detectará el push y recompilará `npm run build` en menos de 1 minuto.
3. **Frontend Cliente (Cloudflare):** Detectará el push y compilará `npm run ionic:build` actualizando el sitio estático globalmente.
