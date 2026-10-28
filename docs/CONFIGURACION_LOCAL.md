# Configuración local

Los pasos completos de instalación están en [README.md](../README.md). Este documento concentra las diferencias entre equipos, variables y pruebas opcionales.

## Herramientas

Usar Node 22, mínimo 22.18, para ambos frontends. Sus `.nvmrc` especifican la rama 22; los administradores de versiones pueden resolver la última versión de esa rama. No se actualizó automáticamente Node ni ninguna dependencia durante esta preparación.

PHP debe ser compatible con composer.lock (proyecto: ^8.2). Instalar Composer 2 y comprobar `composer --version`. En el equipo auditado el wrapper Composer apunta a un composer.phar inexistente; se necesita reparar su instalación local para que `composer install` funcione allí. Las dependencias existentes permitieron ejecutar las pruebas, pero no se certifica una instalación PHP nueva hasta resolver ese problema.

Los comandos Angular y Capacitor se resuelven con las dependencias locales. Ionic CLI global es opcional. Para PowerShell se recomiendan `npm.cmd`/`npx.cmd` cuando los wrappers .ps1 están bloqueados.

## Laravel: archivo privado .env

Partir del `.env.example`, no del `.env` de otro integrante. El ejemplo usa:

| Variable | Propósito |
| --- | --- |
| APP_NAME, APP_ENV, APP_DEBUG, APP_URL | Identidad y entorno local del backend |
| APP_KEY | Generada individualmente con `php artisan key:generate` |
| DB_CONNECTION=mysql | Driver del negocio |
| DB_HOST, DB_PORT, DB_DATABASE | Servidor y base local |
| DB_USERNAME, DB_PASSWORD | Credenciales propias; la contraseña del ejemplo está vacía |
| AUTH_GUARD, AUTH_PASSWORD_BROKER, AUTH_MODEL | Mantienen proveedor Eloquent basado en Usuario |
| SANCTUM_TOKEN_PREFIX | Opcional, no es un secreto |
| ADMIN_ALLOWED_ORIGINS | Orígenes Vue separados por comas |
| CLIENT_ALLOWED_ORIGINS | Orígenes Ionic web/Capacitor separados por comas |
| SESSION_DRIVER, CACHE_STORE, QUEUE_CONNECTION | Infraestructura database, incluida en migraciones |
| LOG_CHANNEL, MAIL_MAILER | Logs locales; correo no necesita proveedor externo para el alcance actual |

Se conservan los ejemplos vacíos/null de Redis, correo y AWS del scaffold. Esos servicios no son necesarios para los endpoints actuales; configurar credenciales propias solo si se activa una integración. No versionar secretos ni valores reales en ejemplos.

Después de cambiar configuración, ejecutar `php artisan config:clear`. No usar la configuración cacheada de otro equipo. En producción se necesita configurar HTTPS y APP_DEBUG=false fuera del repositorio.

## Primera cuenta administrativa

No hay credencial administrativa compartida ni un seeder con contraseña. Para una base nueva, una persona autorizada puede registrar su cuenta local como Cliente en Ionic y luego, en su propia base, asignarle el rol Administrador mediante una sesión de confianza de Tinker:

```bash
php artisan tinker
```

```php
$usuario = App\Models\Usuario::where('correo', 'TU_CORREO_LOCAL')->firstOrFail();
$rol = App\Models\Rol::where('nombre_rol', 'Administrador')->firstOrFail();
$usuario->id_rol = $rol->id_rol;
$usuario->save();
```

Sustituir solo el correo dentro de la sesión local; no pegar contraseñas o tokens en el repositorio ni en informes. Esta operación no se ejecutó durante la preparación y no debe aplicarse a una base compartida sin autorización. Usar una cuenta Cliente diferente para probar Ionic.

## Frontends

Vue: copiar `.env.example` a `.env` en una instalación nueva y definir `VITE_API_URL`. Todo valor VITE_* llega al navegador. Reiniciar Vite después de cambiarlo.

Ionic: `src/environments/environment.ts` contiene solo la URL pública de la API. En navegador utilizar el backend local. Android Emulator usa `10.0.2.2` para alcanzar el equipo anfitrión; un teléfono necesita un dominio o una dirección alcanzable en la red. No sustituir el valor compartido por la IP privada de un desarrollador. Para una prueba física modificar localmente la URL y revisar el diff antes del commit. HTTPS y las políticas de red nativa se preparan al agregar Android.

El CORS predeterminado permite Vue 5173, Ionic 8100/4200 y orígenes Capacitor. Otros puertos, dominios o IP deben añadirse en el `.env` local de Laravel. CORS no sustituye la autenticación ni el control de rol.

## Pruebas adicionales

Dentro de Api-Rest:

```powershell
php artisan test
php artisan route:list --path=api
php scripts/verify-sprint2.php
```

Las primeras dos no requieren datos productivos. La tercera exige MySQL local e InnoDB, realiza fixtures y rollback. No ejecutar tests de integración sobre producción.

Pruebas opcionales de navegador: `scripts/browser-sprint2.mjs` requiere Chromium con depuración local en 9223, Vue en 5173, Ionic de prueba en 8101 y las instancias reales API 8000/Ionic 8100. `scripts/start-sprint2-checks.ps1` es un ayudante **solo Windows**, que detecta Edge/Chrome o recibe `-BrowserPath` y guarda procesos/logs bajo `.sprint2/checks`, excluido de Git. No ejecutarlo con esos puertos ocupados. Cerrar únicamente los procesos iniciados para la verificación, sin afectar servidores ajenos.

`scripts/check-home-scroll.mjs`, preservado desde una carpeta temporal, comprueba rueda, gesto táctil, navegación a secciones y acceso al footer en Ionic 8100. Requiere el navegador en 9223 y **lo cierra al terminar**; utilizar un perfil desechable y no una sesión personal.

Desde la raíz:

```powershell
python Api-Rest/scripts/audit-repository.py
git status --short
git add -n .
```

La auditoría analiza archivos candidatos según las reglas Git y muestra rutas/categorías, nunca valores de secretos. Debe complementarse con revisión humana. La simulación no agrega archivos al índice.
