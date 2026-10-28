# Back Office: Sprint 2

Aplicacion exclusiva para administradores.

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173
npm.cmd run build
```

Abrir `http://127.0.0.1:5173/dashboard`. Se requiere un Usuario con rol Administrador ya aprovisionado; el registro publico solo crea clientes. No se modificaron las credenciales existentes.

La URL de Laravel se configura con `VITE_API_URL` (ejemplo en `.env.example`), por defecto `http://127.0.0.1:8000/api`. Enviar tokens Sanctum Bearer mediante el servicio Axios centralizado. La sesion usa sessionStorage y el guard consulta `/me` en cada navegacion; logout revoca el token actual.

Navegacion preparada: Dashboard, Pedidos, Catalogo y tarifas, Zonas de cobertura y Clientes. Los catalogos se consultan desde Laravel; Pedidos y Clientes son vistas base identificadas como pendientes del Sprint 4. No contienen cifras ficticias ni gestion simulada.

En produccion, configurar el servidor web para resolver las rutas de Vue Router al index.html del frontend. Para Node utilizar la rama 22, version 22.18 o posterior (ver `.nvmrc`).

Resultados y evidencias: `../Api-Rest/SPRINT2_AVANCES.md`.
