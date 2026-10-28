# Preparación de SwiftSite Clean para GitHub

Fecha: 27 de octubre de 2026. Alcance: preparación **local** de un monorepositorio para un futuro repositorio privado. No se creó ningún remoto, commit, push ni modificación de Jira.

## Resultado

Los tres proyectos conservan sus nombres y arquitectura. La raíz contiene .gitignore global, .gitattributes, README, CONTRIBUTING y cuatro documentos bajo docs. Se inicializó Git localmente en la rama `main` después de comprobar que no había repositorios internos. El índice continúa vacío y no existen remotos.

**Los archivos están preparados para revisar y crear el primer commit local.** La publicación queda pendiente de una acción posterior del responsable. El procedimiento de instalación está documentado; en esta máquina existe un problema de Composer que debe repararse para reinstalar PHP desde cero. No se disimula como una instalación limpia aprobada.

## Auditoría realizada

- Recorrido de los tres proyectos, configuraciones, manifiestos, lockfiles, documentación, recursos, temporales y archivos de datos locales.
- Revisión de reglas Git, ausencia de repositorio en la raíz inicial y ausencia de `.git` en los proyectos fuente. No se borró ni movió ningún historial.
- Revisión de scripts y URL de API, autenticación y configuración MySQL/CORS existentes.
- Inspección de archivos grandes candidatos y volumen de dependencias instaladas.
- Auditoría de secretos de alta confianza sobre los archivos que Git incluiría, con salida de rutas y categorías, nunca valores.
- Verificación de reglas sobre 21 casos de exclusión y presencia de 102 archivos esenciales de fuentes, configuraciones, estructura y recursos.
- Comparación del hash de `.env` antes y después: el archivo real no cambió.

Las referencias a una ruta de usuario absoluta quedaron únicamente en `Api-Rest/SPRINT2_AVANCES.md`, un informe histórico. No son dependencias de ejecución. El ayudante Windows de navegador ahora detecta Edge/Chrome o recibe `-BrowserPath`; no depende de una instalación de navegador en una ruta fija del equipo original.

## Archivos creados

En la raíz:

- `.gitignore`
- `.gitattributes`
- `README.md`
- `CONTRIBUTING.md`
- `GITHUB_PREPARACION.md`
- `docs/ARQUITECTURA.md`
- `docs/BASE_DATOS.md`
- `docs/CONFIGURACION_LOCAL.md`
- `docs/FLUJO_GIT.md`

En los proyectos:

- `Api-Rest/scripts/audit-repository.py`: auditoría reproducible de candidatos según Git, sin mostrar secretos.
- `Api-Rest/scripts/check-home-scroll.mjs`: prueba de desplazamiento preservada desde `.scroll-fix/check.mjs` antes de excluir la carpeta temporal.
- `swiftsite-ionic-angular/.gitignore`: exclusiones locales complementarias.

## Archivos modificados

- `Api-Rest/.env.example`: MySQL en lugar de SQLite, datos públicos de aplicación, valores vacíos de secretos, proveedor Usuario y variables CORS de los dos consumidores. No se copió el .env real.
- `Api-Rest/.gitignore`: exclusión de `.github-prep/`, utilizada para preparar archivos fuera del directorio de trabajo autorizado.
- `Api-Rest/scripts/start-sprint2-checks.ps1`: descubrimiento/configuración del navegador para portabilidad entre equipos Windows.
- `swiftsite-admin/.gitignore`: exclusión de variantes privadas de .env preservando ejemplos.

Se revisó y conservó `swiftsite-admin/.env.example` con `VITE_API_URL=http://127.0.0.1:8000/api`. Se conservó la URL pública de `swiftsite-ionic-angular/src/environments/environment.ts` sin sustituirla por una IP privada. Las migraciones, seeders, modelos, controladores, componentes visuales y recursos funcionales no se modificaron por esta preparación.

## Exclusiones verificadas

- vendor y node_modules de todos los proyectos.
- dist, dist-ssr, www, .angular, out-tsc, coverage y cachés de herramientas.
- .env reales y variantes locales; se conservan `.env.example` y variantes terminadas en `.example`.
- Credenciales de Composer/npm, certificados privados y archivos de firma.
- Logs, sesiones, vistas compiladas y caché de bootstrap, conservando los archivos `.gitignore` de estructura de storage/bootstrap.
- Bases .sqlite/.sqlite3/.db, dumps SQL y `Api-Rest/swiftsite_clean`, base SQLite sin extensión.
- `.admin-integration`, `.ionic-fixes`, `.scroll-fix`, `.sprint2` y `.github-prep` de Api-Rest.
- Configuración personal del editor y compilaciones nativas futuras; no se excluyen globalmente fuentes android/ios.

Las carpetas temporales no se eliminaron. Sus fuentes de aplicación tienen correspondencia en los proyectos reales. Los únicos scripts sin destino eran un inspector CDP de diagnóstico (`.sprint2/inspect.mjs`), no indispensable, y la prueba de scroll, que se copió a scripts antes de la exclusión. No se excluyó código funcional que solo existiera temporalmente.

Se comprobó expresamente que sí entran los tres package.json y package-lock.json, composer.json/composer.lock, fuentes de los dos frontends, modelos/controladores, migraciones, seeders, tests, todos los recursos de Ionic, ejemplos de entorno y archivos de estructura de Laravel.

## Seguridad

| Hallazgo | Tratamiento |
| --- | --- |
| `Api-Rest/.env` contiene configuración local y una clave de aplicación | Excluido; no se mostró su contenido ni se modificó. |
| `Api-Rest/database/database.sqlite` y `Api-Rest/swiftsite_clean` son bases locales | Se verificó la firma SQLite sin consultar registros; ambas se excluyeron, incluida la que no tiene extensión. |
| Logs/cachés/perfiles de navegador pueden conservar solicitudes, sesión o datos personales | Excluidos íntegramente. |
| `.env.example` anterior utilizaba SQLite y no guiaba la conexión de negocio | Sustituido por un ejemplo MySQL sin credenciales reales. |
| Configuración pública de frontend | Solo URL local de API; no se añadieron contraseñas ni tokens reales. |
| Posibles tokens o claves privadas en archivos candidatos | La auditoría no encontró patrones de alta confianza. Revisión manual complementaria necesaria en futuros cambios. |

Los tokens y contraseñas de fixtures de pruebas son ejemplos sintéticos o valores generados en ejecución; no se confundieron con credenciales reales. No se hizo rotación automática ni modificación de las cuentas existentes. No se incluyeron registros reales de usuarios ni dumps. El repositorio no tiene historial previo que limpiar.

`audit-repository.py` comprueba claves privadas, formatos conocidos de tokens, claves Laravel no vacías, credenciales en ejemplos y URLs, bases SQLite incluso sin extensión, archivos privados y tamaño. Es una verificación heurística: no certifica ausencia absoluta de secretos ni sustituye la revisión del diff.

## Tamaños y Git LFS

La selección inicial antes de agregar este informe contenía 177 archivos candidatos, aproximadamente 2 MiB en total. El informe final añade un archivo. Ningún candidato superó 1 MiB.

| Archivo mayor | Bytes |
| --- | ---: |
| swiftsite-ionic-angular/package-lock.json | 549279 |
| Api-Rest/composer.lock | 315908 |
| swiftsite-admin/package-lock.json | 190541 |
| swiftsite-ionic-angular/src/assets/fotos/Ducha azul sucia.webp | 123742 |
| Api-Rest/package-lock.json | 98085 |

No se requiere Git LFS para estos archivos. No se eliminaron ni recomprimieron recursos originales. GitHub advierte para archivos superiores a 50 MiB y bloquea los mayores de 100 MiB en Git normal; reevaluar si se agregan recursos grandes. [Referencia oficial](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

Dependencias instaladas excluidas: vendor de Laravel ~114.9 MiB; node_modules de Laravel ~46.8 MiB; de Vue ~150.3 MiB; de Ionic ~345.5 MiB. Estos tamaños locales no representan el peso del repositorio compartido.

## Verificaciones ejecutadas

| Comando o comprobación | Resultado |
| --- | --- |
| `php artisan test --no-ansi` | Aprobado: 20 pruebas y 137 aserciones. |
| `php artisan route:list --path=api` | Aprobado: 22 rutas listadas. |
| Conexión PDO existente y `SELECT VERSION()` | Aprobado: driver mysql, servidor MariaDB 10.4.32. No se cambió el motor ni se modificaron registros. |
| Parseo de `.env.example` con Dotenv | Aprobado: MySQL, Usuario y secretos de ejemplo vacíos. |
| `npm run build` en Vue | Aprobado: vue-tsc y compilación Vite. |
| `npm run ionic:build` en Ionic | Aprobado: compilación Angular de producción. |
| `npm test` en Ionic | Aprobado: 4 pruebas. |
| `npm run type-check` en Ionic | Aprobado. |
| Sintaxis Python del auditor | Aprobada. |
| Auditoría de candidatos Git | Sin hallazgos de secretos de alta confianza ni archivos mayores de 50 MiB. |
| `git check-ignore -v` | Dependencias, datos, env privados y artefactos correctamente ignorados; además 21 casos comprobados programáticamente. |
| Presencia de archivos indispensables | 102 rutas de fuentes/configuración/recursos comprobadas. |
| `git add -n .` | Simulación aprobada; no se agregaron archivos realmente. |
| `git status`, índice y remotos | main sin commits, candidatos untracked, índice vacío y cero remotos. |
| Integridad de `.env` real | Hash idéntico antes y después. |
| `composer --version` | Falló: el wrapper local apunta a composer.phar inexistente. Es una incidencia del entorno, no introducida por la preparación. |
| Instalación limpia con Composer / check-platform-reqs | No ejecutadas: reparar Composer es requisito previo en esta máquina. No se reinstalaron dependencias existentes. |

Las compilaciones se realizaron con Node 26.5.0/npm 11.17.0 instalados en la máquina. Node 26 no pertenece a la matriz de Angular 19; la versión documentada para el equipo es 22.18 o posterior de la rama 22, según `.nvmrc` y requisitos de Vite. No se instaló otra versión ni se afirma haber repetido las pruebas con ella.

No se ejecutaron migraciones, seeders, nuevas funcionalidades, instalación Android Studio, APK ni pruebas contra cuentas administrativas reales durante esta tarea. Las pruebas de navegador previas permanecen documentadas en Sprint 2; no se presentan como ejecutadas de nuevo para la preparación de Git.

## Configuración a realizar por cada integrante

1. Instalar PHP compatible y Composer 2 funcional, servidor MySQL, Git y Node 22.18+ de la rama 22.
2. Ejecutar composer install y npm ci en las carpetas indicadas en README; conservar los lockfiles.
3. Crear su propia base y usuario, copiar ejemplos a entornos privados sin sobrescribir configuraciones existentes y generar su APP_KEY.
4. Ejecutar migraciones y seeders solo para inicializar la base nueva; no reutilizar archivos SQLite ni dumps personales.
5. Configurar API y orígenes CORS locales. Para emuladores/dispositivos, usar una URL alcanzable sin versionar una IP privada del integrante.
6. Crear cuentas locales y aprovisionar rol Administrador mediante un proceso autorizado. No hay contraseña administrativa compartida.
7. Seguir ramas feature/fix y Pull Requests revisados por otra persona.

El README proporciona los comandos de inicio para los puertos 8000/5173/8100. La base local no se modifica al clonar ni al revisar el repositorio.

## Historial y estado Git

No había repositorios internos; no se perdió ni se movió historial. `docs/FLUJO_GIT.md` documenta las opciones subtree/filter-repo/submódulos por si otra copia contiene repositorios. Se ejecutó únicamente la inicialización local en main y comprobaciones; no hay configuración remota ni identidad de autor añadida por esta preparación.

Los comandos de commit/push de CONTRIBUTING y FLUJO_GIT son ejemplos para uso posterior. No se ejecutaron. La privacidad, accesos y protecciones de ramas deberán configurarse cuando el responsable cree el repositorio remoto.

## Lista final

- [x] Laravel preparado: configuración de ejemplo y pruebas existentes aprobadas.
- [x] Vue preparado: código conservado, configuración pública y build aprobado.
- [x] Ionic preparado: fuentes/recursos conservados, tests y build aprobados.
- [x] `.gitignore` comprobado.
- [x] Secretos y datos locales conocidos excluidos.
- [x] README general actualizado.
- [x] Documentación para el equipo.
- [x] Migraciones y seeders conservados.
- [x] Dependencias excluidas.
- [x] Recursos gráficos conservados.
- [x] Pruebas disponibles realizadas y límites documentados.
- [x] Git revisado: sin commits, índice vacío y sin remotos.
- [x] Listo para subir a GitHub: archivos locales preparados para el primer commit y futura publicación privada; nada publicado.
- [ ] Instalación limpia PHP verificada: pendiente de reparar Composer local.
- [ ] Publicación en GitHub: no realizada, por instrucción expresa.

No hay autorización de publicación implícita en esta lista. El siguiente paso pertenece al responsable: revisar los archivos y decidir cuándo crear el primer commit y el repositorio privado.
