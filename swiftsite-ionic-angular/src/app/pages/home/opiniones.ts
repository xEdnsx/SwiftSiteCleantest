/**
 * Opiniones de clientes que se muestran en el Inicio (lógica pura, sin Angular).
 * La API ya entrega solo las que el equipo decidió mostrar, con el nombre abreviado y sin datos de contacto;
 * aquí solo se acomoda lo que se dibuja. Va aparte para poder probarla con `npm test`.
 */

/** Lo que devuelve GET /valoraciones-publicas. */
export interface OpinionPublica {
  id_valoracion: number;
  estrellas: number;
  aspectos: string[];
  comentario: string | null;
  /** Nombre abreviado: «Ana M.». */
  nombre: string;
  fecha: string | null;
}

/** Con 3 o más estrellas los aspectos son lo que gustó; con 1 o 2, lo que se puede mejorar (igual que al valorar). */
export const gustoConEstrellas = (estrellas: number): boolean => estrellas >= 3;

const COMO_PROBLEMA: Record<string, string> = { 'Buen trato': 'Trato', 'Precio justo': 'Precio' };

/** Con 1 o 2 estrellas el aspecto es un problema y se escribe "Trato" / "Precio" (igual que al valorar). */
export const etiquetaAspecto = (aspecto: string, estrellas: number): string =>
  gustoConEstrellas(estrellas) ? aspecto : (COMO_PROBLEMA[aspecto] ?? aspecto);

/** Cuántas opiniones muestra el Inicio (igual que `Valoracion::MAXIMO_EN_APP` de la API). */
export const MAXIMO_OPINIONES = 5;

/** Descarta lo que no se puede dibujar bien (estrellas fuera de 1–5) y respeta el máximo aunque la API enviara de más. */
export function opinionesParaMostrar(lista: readonly OpinionPublica[] | null | undefined): OpinionPublica[] {
  return (lista ?? [])
    .filter((o) => Number.isInteger(o.estrellas) && o.estrellas >= 1 && o.estrellas <= 5)
    .map((o) => ({ ...o, comentario: o.comentario?.trim() ? o.comentario.trim() : null, aspectos: o.aspectos ?? [], nombre: o.nombre?.trim() || 'Cliente' }))
    .slice(0, MAXIMO_OPINIONES);
}

/** «nov 2026» en hora de El Salvador; vacío si la fecha falta o no es válida. */
export function mesYAnio(iso: string | null | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-SV', { month: 'short', year: 'numeric', timeZone: 'America/El_Salvador' })
    .format(fecha)
    .replace(/\./g, '');
}
