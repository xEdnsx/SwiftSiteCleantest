/**
 * Convierte el mensaje que devuelve la API en algo que una persona pueda entender.
 * Los errores internos de la base de datos (con host, consulta SQL, etc.) nunca se muestran tal cual.
 */
export function mensajeLegible(mensaje: unknown): string {
  const texto = typeof mensaje === 'string' ? mensaje.trim() : ''
  if (/unknown column|column not found|base table or view not found|table .* doesn't exist|no such (table|column)/i.test(texto)) {
    return 'Falta actualizar la base de datos. En la carpeta Api-Rest corre «php artisan migrate» y vuelve a intentarlo.'
  }
  if (/SQLSTATE|connection refused|could not find driver|access denied for user/i.test(texto)) {
    return 'La API no pudo usar la base de datos. Revisa que MySQL esté encendido y vuelve a intentarlo.'
  }
  return texto
}
