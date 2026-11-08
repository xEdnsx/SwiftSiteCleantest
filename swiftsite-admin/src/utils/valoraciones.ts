/**
 * Lógica pura de valoraciones para el panel (sin Vue): tipos de la API y funciones de presentación.
 * Va aparte para poder probarla con `npm test`.
 */
import type { PedidoApi } from './pedidos'

export type EstadoValoracion = 'Pendiente' | 'Publicada' | 'Oculta'
export const ESTADOS_VALORACION: EstadoValoracion[] = ['Pendiente', 'Publicada', 'Oculta']

/** Clase de badge (definida en style.css) para cada estado. */
export const badgeValoracion: Record<EstadoValoracion, string> = {
  Pendiente: 'badge-pendiente',
  Publicada: 'badge-confirmado',
  Oculta: 'badge-cotizado',
}

export interface ValoracionApi {
  id_valoracion: number
  id_pedido: number
  estrellas: number
  aspectos: string[]
  comentario: string | null
  estado: EstadoValoracion
  fecha_creacion: string
  usuario: { id_usuario: number; nombre: string; correo: string } | null
  pedido: PedidoApi | null
}

/** Con 3 o más estrellas los aspectos que marcó el cliente son lo que le gustó; con 1 o 2, lo que se puede mejorar (igual que en la app). */
export const gustoConEstrellas = (estrellas: number): boolean => estrellas >= 3
const COMO_PROBLEMA: Record<string, string> = { 'Buen trato': 'Trato', 'Precio justo': 'Precio' }
/** Con 1 o 2 estrellas el aspecto es un problema y se escribe "Trato" / "Precio" (igual que en la app). */
export const etiquetaAspecto = (aspecto: string, estrellas: number): string =>
  gustoConEstrellas(estrellas) ? aspecto : (COMO_PROBLEMA[aspecto] ?? aspecto)
export const etiquetaAspectos = (estrellas: number): string => (gustoConEstrellas(estrellas) ? 'Le gustó' : 'Falló')

/** Promedio con un decimal ("4.5"); "—" si todavía no hay valoraciones. */
export function promedio(lista: Pick<ValoracionApi, 'estrellas'>[]): string {
  if (!lista.length) return '—'
  return (lista.reduce((suma, v) => suma + v.estrellas, 0) / lista.length).toFixed(1)
}

/** Cuántas valoraciones hay en cada estado (y el total en "Todas"). */
export function conteoPorEstado(lista: ValoracionApi[]): Record<EstadoValoracion | 'Todas', number> {
  const cuentas = { Todas: lista.length, Pendiente: 0, Publicada: 0, Oculta: 0 }
  for (const v of lista) cuentas[v.estado] += 1
  return cuentas
}

/** Acciones de moderación que tienen sentido desde cada estado. */
export function accionesDe(estado: EstadoValoracion): EstadoValoracion[] {
  if (estado === 'Pendiente') return ['Publicada', 'Oculta']
  if (estado === 'Publicada') return ['Oculta']
  return ['Publicada']
}

/** Cuántas opiniones muestra la app a la vez (igual que `Valoracion::MAXIMO_EN_APP` de la API). */
export const MAXIMO_EN_APP = 5

/** Texto del botón para pasar a ese estado. */
export const verboDe = (destino: EstadoValoracion): string =>
  destino === 'Publicada' ? 'Mostrar en la app' : destino === 'Oculta' ? 'Ocultar de la app' : 'Volver a pendiente'

/** Cómo se llama cada estado en el panel: «Publicada» significa que la app la está mostrando. */
export const etiquetaEstado: Record<EstadoValoracion, string> = { Pendiente: 'Por revisar', Publicada: 'En la app', Oculta: 'Oculta' }

/** ¿Queda lugar en la app para mostrar otra opinión? */
export const hayLugarEnLaApp = (lista: Pick<ValoracionApi, 'estado'>[]): boolean =>
  lista.filter((v) => v.estado === 'Publicada').length < MAXIMO_EN_APP

/** «Ana Martínez López» → «Ana M.», igual que lo muestra la app (la API hace lo mismo). */
export function nombreAbreviado(nombre?: string | null): string {
  const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return 'Cliente'
  const primero = partes[0] === partes[0]!.toLowerCase() ? partes[0]!.charAt(0).toUpperCase() + partes[0]!.slice(1) : partes[0]!
  return partes.length === 1 ? primero : `${primero} ${partes[1]!.charAt(0).toUpperCase()}.`
}
