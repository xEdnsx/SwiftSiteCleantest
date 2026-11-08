# API de catalogos

Sprint 2: informe completo en [SPRINT2_AVANCES.md](SPRINT2_AVANCES.md). Se conservan los endpoints `/api` existentes.

## Cotizacion preliminar

`POST /api/cotizaciones/preliminar` es publico y tiene limite de 60 solicitudes por minuto. No crea pedidos ni modifica registros.

```json
{"id_zona":1,"items":[{"id_tarifa":1,"cantidad":3}]}
```

Admite de 1 a 100 items, tarifas distintas y cantidades enteras de 1 a 10000. Zona, tarifa y categoria deben estar activas. Se rechazan importes enviados por el cliente; se calculan desde la base de datos con centavos enteros. Responde `preliminar`, `id_zona`, `items`, `subtotal`, `recargo_zona` y `total`, con importes de dos decimales. Datos invalidos o total superior al limite DECIMAL(10,2) devuelven 422.

Login admite `portal: "administrador"` o `portal: "cliente"` opcionalmente. Si las credenciales son validas pero no corresponden al portal, devuelve 403 sin emitir token. Los consumidores existentes sin `portal` conservan compatibilidad; todas las operaciones administrativas mantienen la autorizacion por rol.

Para Ionic, `CLIENT_ALLOWED_ORIGINS` permite configurar origenes adicionales separados por comas sin alterar los origenes administrativos. Los valores por defecto incluyen localhost:8100, localhost:4200 y los origenes de Capacitor. No se usan cookies entre aplicaciones.

## Conexion con swiftsite-admin

El panel Vue usa `VITE_API_URL` y por defecto se conecta a `http://127.0.0.1:8000/api`. Iniciar Laravel con `php artisan serve` y, desde `swiftsite-admin`, ejecutar `npm run dev`. Si cambia la URL de la API, definir `VITE_API_URL` en el `.env` del frontend y reiniciar Vite.

La API permite los origenes `http://localhost:5173` y `http://127.0.0.1:5173`. Para otro dominio o puerto, configurar `ADMIN_ALLOWED_ORIGINS` en el `.env` de Laravel con una lista separada por comas, y ejecutar `php artisan config:clear`.

El panel requiere una cuenta con rol Administrador. Guarda el token en `sessionStorage`, lo agrega como Bearer a las solicitudes y lo elimina cuando la API devuelve 401. Cerrar sesion revoca el token en el servidor. Los catalogos se consultan desde la API; esta conexion no agrega formularios de edicion.

Base: `/api`. Las respuestas y errores son JSON. Enviar cuerpos con `Content-Type: application/json`.

| Metodo | Ruta | Acceso | Resultado |
| --- | --- | --- | --- |
| GET | `/categorias`, `/tarifas`, `/zonas` | Publico | Arreglo de registros, 200 |
| GET | `/categorias/{id}`, `/tarifas/{id}`, `/zonas/{id}` | Publico | Registro, 200 |
| POST | `/categorias`, `/tarifas`, `/zonas` | Administrador | Registro creado, 201 |
| PUT/PATCH | `/categorias/{id}`, `/tarifas/{id}`, `/zonas/{id}` | Administrador | Registro actualizado, 200 |
| DELETE | `/categorias/{id}`, `/tarifas/{id}`, `/zonas/{id}` | Administrador | Sin cuerpo, 204 |

Las escrituras requieren `Authorization: Bearer <token de Sanctum>` de un `Usuario` cuyo rol sea `Administrador`. El rol se comprueba en la base de datos en cada solicitud; cambiarlo afecta tambien a los tokens ya emitidos.

## Autenticacion

Se utiliza `Usuario`, con `correo` y `password_hash`, para emitir tokens Bearer de Laravel Sanctum. La contrasena de entrada se llama `password`; `password_hash` nunca se devuelve.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/register` | Registro publico, siempre como Cliente; cuenta nueva: usuario y token (201). Cuenta de Cliente existente sin contrasena: verificacion por correo (202), sin acceso ni cambios hasta confirmar el codigo |
| POST | `/login` | Valida correo y password; devuelve usuario y token (200) |
| GET | `/me` o `/user` | Devuelve el usuario autenticado y su rol (200) |
| POST | `/logout` | Revoca solo el token utilizado en la solicitud (204) |

### Activacion segura de una cuenta agregada por el panel

Para una cuenta Cliente existente sin contrasena, el primer `POST /register` envia un codigo cifrado al correo registrado. Devuelve `202` con `verification_required: true`, sin usuario ni token de Sanctum. No cambia nombre, contrasena, telefono ni pedidos.

La persona copia el codigo del correo y repite el formulario de registro agregando `claim_token`. Laravel verifica integridad, cuenta, correo y caducidad de 30 minutos, bajo bloqueo transaccional. Solo entonces configura la contrasena hasheada y devuelve 201. El codigo no puede volver a activar una cuenta ya configurada; los tokens anteriores se revocan. Codigos falsos, caducados o correspondientes a otra cuenta devuelven 422. Las cuentas Administrador y las cuentas con contrasena nunca se reclaman por este mecanismo.

El envio se limita por correo a una vez por minuto, ademas del limite general de registro. El codigo solo se entrega por correo; no se devuelve en JSON ni se registra en logs. Configurar un transporte de correo real en el entorno (`MAIL_MAILER`, host, puerto y credenciales propias). Con transportes `log` o `array`, la activacion falla de forma segura con 503 y conserva la cuenta. No modificar ni publicar el `.env` para compartir credenciales. En las pruebas se usa un fake o un servidor SMTP local aislado.

Los seeders de zonas y tarifas ahora solo crean entradas faltantes: volver a ejecutarlos no cambia recargos, precios ni visibilidad de registros existentes, incluidos los personalizados o antiguos.

Ejemplo de cuerpo para `/api/register`:

```json
{
  "nombre": "Ana Perez",
  "correo": "ana@example.com",
  "telefono": "70000000",
  "password": "clave-segura-123",
  "password_confirmation": "clave-segura-123",
  "device_name": "Postman"
}
```

`telefono` y `device_name` son opcionales. La contrasena debe tener entre 8 y 72 caracteres. El registro rechaza `id_rol`, `rol` y `password_hash`. Si no existe el rol Cliente, se crea dentro de la transaccion de registro.

Para `/api/login`, enviar `correo`, `password` y opcionalmente `device_name`. Credenciales incorrectas devuelven 401. Registro y login admiten cinco solicitudes por minuto por IP cada uno; al exceder el limite devuelven 429.

Registro y login devuelven `usuario`, `token`, `token_type` (`Bearer`) y `expires_at`. Guardar el token recibido y enviarlo en `Authorization: Bearer <token>` para las solicitudes protegidas. Cada token vence a los siete dias. Logout no revoca los tokens de otros dispositivos. Tokens invalidos, vencidos o revocados devuelven 401.

El registro publico no crea administradores. Las cuentas Administrador deben aprovisionarse mediante un proceso interno de confianza, asignando el rol existente en `roles`; no hay endpoint publico para elevar privilegios.

Las migraciones de usuarios y `personal_access_tokens` ya existen. En una instalacion nueva ejecutar `php artisan migrate` sobre la base MySQL configurada. Implementacion basada en la [documentacion de Laravel Sanctum 12](https://laravel.com/docs/12.x/sanctum).

## Catalogos

Filtros opcionales: `?activo=1` o `?activo=0` en los tres listados; `/tarifas?id_categoria=1` filtra por categoria. Sin filtros se conserva el listado de todos los registros.

Campos de creacion:

- Categoria: `nombre` (obligatorio, unico, maximo 80), `descripcion` (opcional, admite null, maximo 300), `activo` (opcional, booleano).
- Tarifa: `id_categoria` (obligatorio y existente), `tipo_item` (obligatorio, maximo 100), `material` (opcional, admite null, maximo 80), `precio_unitario` (obligatorio, entre 0 y 99999999.99, hasta dos decimales), `activo` (opcional).
- Zona: `nombre` (obligatorio, unico, maximo 100), `recargo` (opcional, entre 0 y 99999999.99, hasta dos decimales), `activo` (opcional). El panel no crea ni borra zonas (vienen de `ZonasCoberturaSeeder`): solo envia `activo` y `recargo`. Una zona desactivada deja de aparecer en `GET /zonas?activo=1` y la cotizacion o el pedido nuevo en esa zona responden 422; los pedidos ya creados no cambian.

En actualizaciones se envian solo los campos a cambiar. Los importes se devuelven como cadenas con dos decimales. Los campos adicionales no se asignan al modelo.

Errores: 401 sin autenticacion, 403 sin rol administrador, 404 registro inexistente, 409 conflicto por relaciones o restricciones de integridad, 422 validacion fallida (campos en `errors`). Si hay registros asociados, desactivar con `PATCH {"activo":false}` en lugar de eliminar.

Ejemplo de creacion de tarifa:

```json
{
  "id_categoria": 1,
  "tipo_item": "Silla individual",
  "material": "Tela",
  "precio_unitario": "12.50",
  "activo": true
}
```

Pruebas: `php artisan test`. Los tests usan SQLite en memoria; no modifican la base de datos de la aplicacion. Las migraciones productivas contienen `ALTER TABLE ... ADD CONSTRAINT` especifico de MySQL, por lo que los tests de catalogos crean un esquema SQLite de prueba.

## Reportes de problemas (app del cliente)

Requieren sesion (`Authorization: Bearer <token>`).

- `POST /api/reportes` (limite 10 por minuto): `id_pedido` (entero), `motivo` (`Limpieza incompleta`, `Daño en mi pertenencia`, `Llegaron tarde`, `Cobro incorrecto`, `Trato del personal` u `Otro`) y `descripcion` (entre 10 y 500 caracteres). Responde 201 con el reporte (`id_reporte`, `id_pedido`, `motivo`, `descripcion`, `estado`, `respuesta`, `fecha_creacion`). El estado inicial siempre es `Recibido`; `id_usuario`, `estado` y `respuesta` no se aceptan.
- `GET /api/mis-reportes`: reportes de la persona, del mas reciente al mas antiguo.

Errores: 404 si el pedido no existe o es de otra persona; 422 si el pedido no esta `Finalizado`, si ya hay un reporte abierto de ese pedido (se puede volver a reportar cuando el anterior pasa a `Resuelto`) o si falla la validacion. Al eliminar su cuenta, el texto de los reportes se reemplaza por `Texto eliminado por el titular`.

## Valoraciones (app del cliente)

Requieren sesion.

- `POST /api/valoraciones` (limite 10 por minuto): `id_pedido`, `estrellas` (1 a 5), `aspectos` (opcional; sin repetir, entre `Puntualidad`, `Limpieza`, `Buen trato` y `Precio justo`) y `comentario` (opcional, hasta 500 caracteres). Responde 201 con la valoracion (`id_valoracion`, `id_pedido`, `estrellas`, `aspectos`, `comentario`, `estado`, `fecha_creacion`). Nace siempre `Pendiente`; `id_usuario` y `estado` no se aceptan.
- `GET /api/mis-valoraciones`: valoraciones de la persona.
- `GET /api/valoraciones-publicas` (publica, sin sesion; limite 60 por minuto): las opiniones que el administrador decidio mostrar en el Inicio de la app. Solo las `Publicada`, como maximo 5 (las mas recientes). Cada una trae `id_valoracion`, `estrellas`, `aspectos`, `comentario`, `nombre` (abreviado, por ejemplo `Ana M.`) y `fecha`; nunca incluye correo, telefono ni datos del pedido.

Errores: 404 si el pedido no existe o es de otra persona; 422 si el pedido no esta `Finalizado`, si ya valoro ese pedido (`Ya valoraste este pedido.`) o si falla la validacion. `GET /api/mis-pedidos` incluye en cada pedido `valoracion` (`id_valoracion`, `estrellas`, `estado`, o `null`) y `reportes` (`id_reporte`, `motivo`, `estado`). Al eliminar su cuenta, el comentario de sus valoraciones se borra.

## Panel administrativo: reportes, valoraciones y pendientes

Requieren sesion con rol Administrador (403 en otro caso).

| Metodo | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/admin/reportes` | Reportes con `usuario` y `pedido`. Los abiertos van primero; filtros `?estado=` y `?buscar=` (`R-0004` busca el reporte, `#0004` el pedido, otro texto el nombre o correo del cliente). |
| PATCH | `/api/admin/reportes/{id}` | Cambia `estado` y/o `respuesta` (hasta 500; el texto vacio se guarda como null). Para pasar a `Resuelto` hace falta una respuesta: 422 si falta. Un reporte `Resuelto` ya no se puede modificar (422 en `estado`). |
| GET | `/api/admin/valoraciones` | Valoraciones con `usuario` y `pedido`; primero las `Pendiente`. Filtro `?estado=`. |
| PATCH | `/api/admin/valoraciones/{id}` | Cambia `estado` a `Pendiente`, `Publicada` (mostrar en la app) u `Oculta`. Si ya hay 5 `Publicada`, pasar otra a `Publicada` responde 422 en `estado` (`Ya hay 5 valoraciones en la app. Oculta una para mostrar otra.`). El panel decide cuales se ven; buenas o malas, ninguna se filtra por estrellas. |
| DELETE | `/api/admin/valoraciones/{id}` | Elimina la valoracion (204). |
| GET | `/api/admin/pendientes` | Contadores para el menu del panel: `pedidos_por_confirmar`, `reportes_abiertos` y `valoraciones_pendientes`. |

Clientes (`/api/admin/clientes`): `nombre` es obligatorio; `telefono` y `correo` son opcionales, pero hace falta al menos uno de los dos (422 si faltan ambos). La direccion no se pide: el cliente la escribe en cada cotizacion. Un cliente creado sin correo no puede entrar a la app hasta crear su cuenta; a quien ya tiene cuenta no se le puede quitar el correo.

`GET /api/mis-reportes` devuelve la `respuesta` del equipo y `fecha_actualizacion`; asi la app muestra la respuesta al cliente.

Los pedidos del panel (`/api/admin/pedidos`) tambien traen `reportes` y `valoracion`. Pruebas: `ReportesApiTest`, `ReportesAdminApiTest` y `ValoracionesApiTest`.
