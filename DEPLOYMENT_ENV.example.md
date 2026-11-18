# Matriz de Variables de Entorno para Despliegue — SwiftSite Clean

Esta tabla resume todas las variables de entorno necesarias para la publicación en producción, el servicio en la nube donde deben registrarse y su explicación técnica. **No contiene secretos ni valores privados.**

---

## 1. Variables para el Backend (Render Web Service)

| Variable | Servicio | Valor Típico / Ejemplo | Explicación Técnica |
|---|---|---|---|
| `APP_NAME` | Render | `SwiftSite Clean` | Nombre oficial de la aplicación en correos y logs. |
| `APP_ENV` | Render | `production` | Establece el entorno en modo producción (desactiva diagnósticos interactivos y activa optimizaciones). |
| `APP_KEY` | Render | `base64:...` *(Generado por `php artisan key:generate --show`)* | Clave de cifrado de Laravel de 32 bytes requerida para sesiones, tokens y cookies. |
| `APP_DEBUG` | Render | `false` | Desactiva el visor de errores detallado (Ignition) para no filtrar datos sensibles ante excepciones. |
| `APP_URL` | Render | `https://tu-servicio.onrender.com` | URL base pública de la API en Render. |
| `LOG_CHANNEL` | Render | `stderr` | Envía todos los logs de Laravel a la salida estándar de errores para que Render los muestre en su consola en tiempo real. |
| `LOG_LEVEL` | Render | `error` | Filtra el nivel mínimo de severidad para registrar en logs (evita llenar memoria con mensajes de depuración). |
| `DB_CONNECTION` | Render | `mysql` | Driver de conexión a la base de datos (compatible con TiDB). |
| `DB_HOST` | Render | `gateway01.us-east-1.prod.aws.tidbcloud.com` | Host del clúster TiDB Cloud Starter. |
| `DB_PORT` | Render | `4000` | Puerto predeterminado de comunicación de TiDB Cloud. |
| `DB_DATABASE` | Render | `swiftsite_clean` | Nombre de la base de datos creada en TiDB. |
| `DB_USERNAME` | Render | `xxxxxx.root` | Usuario con permisos asignado por TiDB Cloud. |
| `DB_PASSWORD` | Render | `[SECRETO]` | Contraseña de autenticación de TiDB Cloud. |
| `DB_SSL_CA` | Render | `/etc/ssl/certs/ca-certificates.crt` | *(Opcional)* Ruta al certificado raíz para validar la conexión TLS con TiDB. La imagen Docker ya lo resuelve por defecto si no se especifica. |
| `ADMIN_ALLOWED_ORIGINS` | Render | `https://swiftsite-admin.pages.dev` | Origen web autorizado del panel administrativo Vue para CORS. |
| `CLIENT_ALLOWED_ORIGINS` | Render | `https://swiftsite-client.pages.dev,capacitor://localhost,http://localhost` | Orígenes web y nativos autorizados de la aplicación cliente para CORS. |
| `SESSION_DRIVER` | Render | `database` o `file` | Mecanismo de persistencia de sesiones. `database` es el más seguro en entornos con reinicios de contenedor. |
| `CACHE_STORE` | Render | `database` o `file` | Almacén de caché de la aplicación. |
| `QUEUE_CONNECTION` | Render | `database` o `sync` | Manejador de colas de tareas en segundo plano. |
| `FILESYSTEM_DISK` | Render | `local` o `s3` | Disco de almacenamiento de archivos. |
| `RUN_SEEDERS` | Render | `true` *(primer deploy)* / `false` *(deploys continuos)* | Controla si `entrypoint.sh` ejecuta `php artisan db:seed --force` durante el arranque. Debe apagarse tras la inicialización. |
| `LEGAL_VERSION` | Render | `2026-11-08` | Versión vigente de términos de servicio y aviso de privacidad requerida para el consentimiento del cliente. |
| `MAIL_MAILER` | Render | `smtp` | Driver de envío de correos electrónicos. |
| `MAIL_HOST` | Render | `smtp-relay.brevo.com` | Servidor SMTP del proveedor de correo transaccional. |
| `MAIL_PORT` | Render | `587` | Puerto de conexión SMTP TLS. |
| `MAIL_USERNAME` | Render | `[SECRETO]` | Usuario de autenticación SMTP. |
| `MAIL_PASSWORD` | Render | `[SECRETO]` | Contraseña de autenticación SMTP. |
| `MAIL_ENCRYPTION` | Render | `tls` | Tipo de cifrado para la conexión con el servidor de correo. |
| `MAIL_FROM_ADDRESS` | Render | `notificaciones@swiftsite.com` | Dirección de remitente que verán los usuarios en los correos recibidos. |
| `MAIL_FROM_NAME` | Render | `SwiftSite Clean` | Nombre del remitente que verán los usuarios. |
| `AWS_ACCESS_KEY_ID` | Render | *(Solo si se usa S3 / Cloudflare R2)* | Clave de acceso a buckets S3. |
| `AWS_SECRET_ACCESS_KEY` | Render | *(Solo si se usa S3 / Cloudflare R2)* | Clave secreta para buckets S3. |
| `AWS_DEFAULT_REGION` | Render | `auto` | Región del bucket S3 o R2. |
| `AWS_BUCKET` | Render | *(Solo si se usa S3 / Cloudflare R2)* | Nombre del bucket de almacenamiento. |
| `AWS_ENDPOINT` | Render | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | Endpoint personalizado compatible con S3 (ej. Cloudflare R2). |
| `AWS_USE_PATH_STYLE_ENDPOINT` | Render | `false` | Estilo de direccionamiento del endpoint S3. |

---

## 2. Variables para el Panel Administrativo (Cloudflare Pages)

| Variable | Servicio | Valor Típico / Ejemplo | Explicación Técnica |
|---|---|---|---|
| `VITE_API_URL` | Cloudflare Pages (swiftsite-admin) | `https://tu-servicio.onrender.com/api` | Define la URL base de la API hacia la que el cliente Axios enviará todas las peticiones administrativas. Debe terminar en `/api`. |

---

## 3. Variables para la Aplicación Cliente (Ionic Angular)

| Variable | Archivo / Configuración | Valor Típico / Ejemplo | Explicación Técnica |
|---|---|---|---|
| `apiUrl` | `src/environments/environment.prod.ts` | `https://tu-servicio.onrender.com/api` | URL base de la API de producción hacia la que el interceptor y los servicios HTTP de Angular enviarán las peticiones del cliente. |
| `webDir` | `capacitor.config.ts` | `www/browser` | Directorio de salida generado por la compilación de Angular 19 para sincronización nativa con Android/Capacitor. |
