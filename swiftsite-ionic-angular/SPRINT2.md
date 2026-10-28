# Ionic: Sprint 2

Aplicacion exclusiva para clientes; el Back Office se mantiene en Vue.

## Ejecucion

En PowerShell, desde esta carpeta:

```powershell
npm.cmd run dev
```

Abrir `http://localhost:8100`. El script ejecuta Angular directamente con `--open=false`; no invoca `ionic serve` recursivamente. Si 8100 esta ocupado, verificar la instancia existente o ejecutar `npm.cmd run dev -- --port 8101`. No es necesario cambiar la politica de ejecucion de PowerShell para usar npm.cmd.

```powershell
npm.cmd test
npm.cmd run type-check
npm.cmd run ionic:build
npx.cmd --no-install cap --version
npx.cmd --no-install cap ls
```

Node recomendado: 22.18 o posterior de la rama 22 (ver `.nvmrc`). Angular 19 y Vue/Vite de los proyectos comparten compatibilidad con esa rama. La maquina de verificacion tenia Node 26.5.0; los builds pasaron, pero esa version no figura en la matriz de Angular 19.

## Configuracion y alcance

- URL central de Laravel en `src/environments/environment.ts`. Por defecto: `http://127.0.0.1:8000/api`.
- Emulador Android: usar `http://10.0.2.2:8000/api`; dispositivo fisico: dominio HTTPS o IP LAN alcanzable. La politica de transporte nativa se configura al preparar Android; no se genero APK en este sprint.
- `/inicio` conserva la landing; `/cotizar` permite una estimacion publica de un servicio; `/pedidos` y `/perfil` requieren un cliente autenticado.
- `/login` y `/registro` consumen Laravel. Un Administrador no puede iniciar sesion en el portal cliente.
- Token en sessionStorage, interceptor limitado a la URL de Laravel, timeout y manejo de 401. La recarga verifica `/me`. Logout revoca el token antes de borrarlo localmente.
- La cotizacion no crea pedidos. El seguimiento de pedidos queda indicado como Sprint 3, sin datos ficticios.
- Se conserva `503XXXXXXXX` por indicacion del usuario; WhatsApp permanece desactivado hasta configurar un numero valido.
- Capacitor 7.6.9 funciona. `cap ls` indica que no puede listar plugins para web porque no existe plataforma nativa agregada. Android Studio no es un requisito del Sprint 2.

El informe de evidencias y los archivos de verificacion compartidos estan en `../Api-Rest/SPRINT2_AVANCES.md` y `../Api-Rest/scripts/`.
