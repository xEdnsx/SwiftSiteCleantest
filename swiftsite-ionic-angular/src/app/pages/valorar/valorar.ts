/**
 * Lógica pura de "Valorar un servicio" (sin Angular): tipos de la API y validaciones.
 * Va aparte para poder probarla con `npm test`.
 */

/** Aspectos que acepta la API (Valoracion::ASPECTOS). */
export const ASPECTOS = ['Puntualidad', 'Limpieza', 'Buen trato', 'Precio justo'] as const;
export type AspectoValoracion = (typeof ASPECTOS)[number];
export type EstadoValoracion = 'Pendiente' | 'Publicada' | 'Oculta';

export const COMENTARIO_MAX = 500;
export const ETIQUETAS_ESTRELLAS = ['', 'Mal', 'Regular', 'Bien', 'Muy bien', 'Excelente'] as const;

/**
 * Los aspectos son los mismos temas para todos, pero su sentido depende de las estrellas:
 * con 3 o más (Bien, Muy bien, Excelente) son lo que gustó; con 1 o 2, en qué se falló.
 * La API no guarda esa diferencia: se deduce de las estrellas (igual en Inicio y en el panel).
 */
export const gustoConEstrellas = (estrellas: number): boolean => estrellas >= 3;

/** Con 1 o 2 estrellas el tema se nombra como problema: "Trato" y "Precio" (se guarda igual: 'Buen trato' y 'Precio justo'). */
const COMO_PROBLEMA: Record<string, string> = { 'Buen trato': 'Trato', 'Precio justo': 'Precio' };

/** Cómo se escribe un aspecto según las estrellas (lo guardado en la API no cambia). */
export const etiquetaAspecto = (aspecto: string, estrellas: number): string =>
  gustoConEstrellas(estrellas) ? aspecto : (COMO_PROBLEMA[aspecto] ?? aspecto);

export interface TextosAspectos { pregunta: string; resumen: string; ejemplo: string; }

/** Textos del formulario según las estrellas elegidas. */
export function textosAspectos(estrellas: number): TextosAspectos {
  return gustoConEstrellas(estrellas)
    ? { pregunta: '¿Qué te gustó?', resumen: 'Te gustó', ejemplo: 'Ej. El baño quedó como nuevo.' }
    : { pregunta: '¿En qué fallamos?', resumen: 'Fallamos en', ejemplo: 'Ej. Llegaron tarde y quedó una mancha en el piso.' };
}

/** Lo mínimo de la valoración que viene dentro de cada pedido (Mis pedidos). */
export interface ValoracionDePedido {
  id_valoracion: number;
  estrellas: number;
  estado: EstadoValoracion;
}

export interface ValoracionApi extends ValoracionDePedido {
  id_pedido: number;
  aspectos: AspectoValoracion[];
  comentario: string | null;
  fecha_creacion: string;
}

export interface NuevaValoracion {
  id_pedido: number;
  estrellas: number;
  aspectos: AspectoValoracion[];
  comentario: string | null;
}

/** Quita espacios sobrantes y compacta saltos de línea repetidos. */
export const limpiarComentario = (texto: string): string => texto.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

export interface EstadoFormulario { valido: boolean; falta: string; }

/** Qué le falta al formulario para poder enviarse (texto vacío si está completo). */
export function estadoFormulario(estrellas: number, comentario: string): EstadoFormulario {
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) return { valido: false, falta: 'Elige cuántas estrellas das.' };
  if (limpiarComentario(comentario).length > COMENTARIO_MAX) return { valido: false, falta: `El comentario puede tener hasta ${COMENTARIO_MAX} letras.` };
  return { valido: true, falta: '' };
}

/** Arma lo que se envía a la API: aspectos en el orden fijo y comentario vacío como null. */
export function armarValoracion(idPedido: number, estrellas: number, elegidos: ReadonlySet<string>, comentario: string): NuevaValoracion {
  const texto = limpiarComentario(comentario);
  return {
    id_pedido: idPedido,
    estrellas,
    aspectos: ASPECTOS.filter((a) => elegidos.has(a)),
    comentario: texto === '' ? null : texto,
  };
}

