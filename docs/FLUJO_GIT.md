# Flujo Git y preparación del monorepositorio

El trabajo diario se describe en [CONTRIBUTING.md](../CONTRIBUTING.md). Este documento cubre el estado inicial y las decisiones de historial.

## Estado auditado

No existía un repositorio Git en la raíz ni archivos/carpetas `.git` internos en los tres proyectos. La inspección recorrió el código y las configuraciones y excluyó dependencias y salidas generadas. Por ello se puede inicializar un único repositorio local sin convertir proyectos internos en submódulos ni perder historial existente.

La inicialización local utiliza `git init -b main`. No crea commits, no agrega archivos al índice y no configura un remoto. El resultado verificado se registra en [GITHUB_PREPARACION.md](../GITHUB_PREPARACION.md).

## Si en otra copia aparecen repositorios internos

No borrar, mover ni reinicializar sus `.git`. Detener la integración del historial y acordar una opción:

1. Importar con git subtree preservando el historial y ubicándolo bajo el prefijo del proyecto. Revisar ramas, autores y secretos del historial antes de unirlo.
2. Usar git filter-repo en copias de trabajo separadas para prefijar rutas y luego integrar historiales. Reescribe identificadores; requiere coordinación y copias de respaldo.
3. Mantener submódulos si el equipo acepta repositorios separados. No es el monorepositorio autónomo solicitado y requiere una decisión explícita.

No se ejecutó ninguna de estas migraciones porque no había repositorios internos.

## Revisión del primer commit

Desde la raíz:

```bash
git status
git status --short
git check-ignore -v Api-Rest/vendor/
git check-ignore -v swiftsite-admin/node_modules/
git check-ignore -v swiftsite-ionic-angular/node_modules/
git add -n .
python Api-Rest/scripts/audit-repository.py
```

Comprobar que se conservan los lockfiles, .env.example, fuentes, tests, migraciones, semillas, fotos/logotipos y .gitignore de storage/bootstrap. Ningún archivo .env privado, base, dump, log, dependencia o perfil de navegador debe aparecer en la simulación. Los archivos ya trackeados no dejan de estarlo por añadir una regla ignore; no hay archivos trackeados en la preparación inicial, pero debe revisarse en futuros commits. Referencia: [gitignore](https://git-scm.com/docs/gitignore).

Después de la revisión y cuando el responsable decida registrar la primera versión, puede ejecutar manualmente:

```bash
git add .
git diff --cached --stat
git diff --cached
git commit -m "chore: preparar monorepositorio SwiftSite Clean"
```

Estos comandos de agregado real/commit no se ejecutan durante la preparación. El repositorio puede tener muchos archivos untracked y seguir estando correctamente preparado.

## Publicación posterior

El responsable creará un único repositorio **privado** y configurará acceso de equipo y protecciones de main. Revisar nuevamente los archivos antes de configurar el remoto o publicar. No se crea un remoto ni se ejecuta push en este trabajo. Los ejemplos de push de CONTRIBUTING.md son instrucciones futuras.

## Archivos grandes

Se conservaron los recursos originales. El informe final registra los archivos mayores y sus tamaños. GitHub advierte a partir de 50 MiB y bloquea archivos superiores a 100 MiB en Git normal; utilizar Git LFS si se necesitan archivos grandes en el futuro. No configurar LFS indiscriminadamente ni eliminar fotos para reducir tamaños. Referencia: [límites de GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

## Normalización

`.gitattributes` utiliza LF para texto y CRLF para .bat/.cmd; los recursos binarios no se normalizan. No se ejecuta una renormalización masiva del árbol. Los atributos locales de cada proyecto se conservaron; Git puede avisar de CRLF en archivos existentes al simular/agregar sin que eso signifique pérdida de código.
