/**
 * Validación de la dirección exacta (lógica pura).
 *
 * Una dirección salvadoreña normal lleva colonia o residencial, calle/avenida/pasaje, número de casa y,
 * casi siempre, un punto de referencia. Ejemplo: "Col. Escalón, 87 Av. Norte, pasaje 3, casa #12, frente a Súper Selectos".
 * Exigimos un mínimo razonable de texto y de palabras para no recibir "casa" o "mi casa" y que el equipo no tenga que adivinar.
 */
export const DIRECCION_MIN = 25;
export const DIRECCION_MAX = 200;
export const DIRECCION_PALABRAS_MIN = 4;
export const DIRECCION_EJEMPLO = 'Ej.: Col. Escalón, 87 Av. Norte, pasaje 3, casa #12, frente a Súper Selectos';

/** Quita espacios de más al inicio, al final y entre palabras. */
export const normalizarDireccion = (texto: string): string => texto.trim().replace(/\s+/g, ' ');

export const contarPalabras = (texto: string): number => {
  const n = normalizarDireccion(texto);
  return n ? n.split(' ').length : 0;
};

export interface EstadoDireccion { valida: boolean; mensaje: string; }

export function estadoDireccion(texto: string): EstadoDireccion {
  const n = normalizarDireccion(texto);
  if (n.length === 0) {
    return { valida: false, mensaje: 'Escribe tu colonia o residencial, calle o pasaje, número de casa y un punto de referencia. Nuestro equipo irá exactamente a esa dirección.' };
  }
  if (n.length < DIRECCION_MIN || contarPalabras(n) < DIRECCION_PALABRAS_MIN) {
    return { valida: false, mensaje: 'Aún le falta: agrega la colonia, la calle, el número de casa y una referencia (por ejemplo, "frente a la tienda").' };
  }
  return { valida: true, mensaje: 'Perfecto, con eso el equipo sabrá cómo llegar.' };
}
