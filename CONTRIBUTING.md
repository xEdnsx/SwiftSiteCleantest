# Guía de colaboración

Leer primero [README.md](README.md) e instalar las dependencias con los lockfiles existentes. Cada integrante configura su `.env`, su base de datos y su cuenta local; no se comparten contraseñas.

## Ramas

- `main`: versión estable.
- `develop`: opcional, únicamente si el equipo acuerda usarla como rama de integración. No se crea automáticamente.
- `feature/SC-XX-descripcion`: nueva funcionalidad.
- `fix/SC-XX-error`: corrección de un defecto.

Por defecto, partir de main y enviar el Pull Request a main. Si se adopta develop, sustituir la rama base de forma consistente.

## Trabajo diario

Los siguientes comandos son ejemplos para después de que el responsable publique el repositorio privado y conceda acceso. Esta preparación no ejecuta ningún push.

```bash
git clone <URL_PRIVADA_DEL_REPOSITORIO> swiftsite-clean
cd swiftsite-clean
git switch main
git pull --ff-only origin main
git checkout -b feature/SC-28-endpoints-rest
```

Antes de registrar cambios:

```bash
git status --short
git diff --check
git diff
git add -n .
```

Revisar las rutas listadas en la simulación. Preferir `git add <archivos-revisados>`; se puede utilizar el siguiente flujo después de comprobar todos los archivos:

```bash
git add .
git diff --cached --stat
git diff --cached
git commit -m "SC-28: validar endpoints REST"
git push -u origin feature/SC-28-endpoints-rest
```

El identificador Jira en la rama, el commit y el Pull Request permite relacionar la tarea con el código. No modificar estados de Jira por el solo hecho de crear un commit.

## Actualizar una rama y resolver conflictos

Con el árbol de trabajo limpio, estando en la rama de la tarea:

```bash
git fetch origin
git merge origin/main
```

Si hay conflictos, abrir los archivos indicados por `git status`, comparar ambos cambios y acordar la solución con quien los implementó. Eliminar los marcadores de conflicto, volver a ejecutar las comprobaciones, agregar únicamente los archivos resueltos y terminar el merge con `git commit`. Si es necesario abandonar un merge iniciado con el árbol limpio, utilizar `git merge --abort`.

No usar `git reset --hard`, borrar `.git` ni forzar push para resolver conflictos. Si el equipo elige rebase, coordinarlo antes y no reescribir ramas compartidas.

## Pull Requests

Crear el PR en GitHub desde la rama de la tarea hacia main o la base acordada. Incluir problema, cambio de comportamiento, tarea Jira, archivos o áreas afectadas y comandos de validación con sus resultados. Para cambios visuales, adjuntar una captura sin información personal.

Otro integrante debe revisar antes de integrar. Comprobar seguridad, contratos de API, compatibilidad entre los dos consumidores, migraciones no destructivas, pruebas y ausencia de secretos. El autor atiende los comentarios y la persona responsable integra según el acuerdo del equipo. Configurar protecciones de rama al crear el remoto; no existen todavía en esta preparación local.

## Verificación por proyecto

- Laravel: `php artisan test`, `php artisan route:list --path=api`. Para una base local preparada, `php scripts/verify-sprint2.php` realiza integración con rollback.
- Vue: `npm run type-check` y `npm run build`.
- Ionic: `npm test`, `npm run type-check` y `npm run ionic:build`.
- Repositorio: `python Api-Rest/scripts/audit-repository.py` desde la raíz, si Python 3 está disponible. Revisar manualmente los resultados: no certifica ausencia absoluta de secretos.

En PowerShell se puede usar `npm.cmd` en lugar de `npm`. Mantener el formato del proyecto; no reformatear módulos ajenos a la tarea sin necesidad.

## Archivos que deben conservarse

Código fuente, migraciones, seeders, tests, fotografías, logotipos, configuraciones sin secretos, archivos `.env.example`, documentación, `composer.lock` y todos los `package-lock.json`.

No subir `.env` reales, archivos de autenticación de Composer/npm, bases SQLite incluso sin extensión, dumps SQL, logs, sesiones, certificados privados, perfiles de navegador, carpetas temporales de Codex, vendor, node_modules, dist o www. Revisar las variables de frontend: todas se consideran públicas.

Ante un secreto añadido por error, detener la publicación y avisar al responsable mediante un canal autorizado. Cambiar `.gitignore` no elimina un secreto ya registrado en el historial. Su revocación/rotación y la limpieza del historial requieren coordinación; no publicar su valor en un issue ni un PR.

Detalles sobre el primer commit y posibles historiales internos en [FLUJO_GIT.md](docs/FLUJO_GIT.md).
