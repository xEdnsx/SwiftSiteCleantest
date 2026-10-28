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
| POST | `/register` | Registro publico, siempre como Cliente; devuelve usuario y token (201) |
| POST | `/login` | Valida correo y password; devuelve usuario y token (200) |
| GET | `/me` o `/user` | Devuelve el usuario autenticado y su rol (200) |
| POST | `/logout` | Revoca solo el token utilizado en la solicitud (204) |

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
- Zona: `nombre` (obligatorio, unico, maximo 100), `recargo` (opcional, entre 0 y 99999999.99, hasta dos decimales), `activo` (opcional).

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
