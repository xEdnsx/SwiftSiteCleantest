# Back Office: Sprint 2

Aplicacion exclusiva para administradores.

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173
npm.cmd run build
```

Abrir `http://127.0.0.1:5173/dashboard`. Se requiere un Usuario con rol Administrador ya aprovisionado; el registro publico solo crea clientes. No se modificaron las credenciales existentes.

La URL de Laravel se configura con `VITE_API_URL` (ejemplo en `.env.example`), por defecto `http://127.0.0.1:8000/api`. Enviar tokens Sanctum Bearer mediante el servicio Axios centralizado. La sesion usa sessionStorage y el guard consulta `/me` en cada navegacion; logout revoca el token actual.

Pantallas (solo para computador; el panel no esta pensado para celular): Inicio (resumen del dia y lo que necesita atencion), Pedidos (cambiar estado, ver reportes y valoracion de cada uno), Catalogo (categorias, tarifas y zonas; las 44 zonas se navegan por departamento y solo se activan, desactivan o cambian de recargo: no se crean ni se borran desde el panel), Clientes, Reportes (responder y cerrar los problemas que cuentan los clientes) y Valoraciones (se ven todas, buenas o malas; con "Mostrar en la app" / "Ocultar de la app" decides cuales salen en el Inicio de la app, hasta 5, o las eliminas). Todo se lee de la API de Laravel; no hay datos de ejemplo. El menu muestra globos con lo pendiente (pedidos por confirmar, reportes abiertos y valoraciones por revisar) y se actualiza solo cada 30 segundos.

En produccion, configurar el servidor web para resolver las rutas de Vue Router al index.html del frontend. Para Node utilizar la rama 22, version 22.18 o posterior (ver `.nvmrc`).

Resultados y evidencias: `../Api-Rest/SPRINT2_AVANCES.md`.

Pruebas de la logica del panel: `npm test`.
