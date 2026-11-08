/**
 * Lógica pura de reportes para el panel (sin Vue): tipos de la API y funciones de presentación.
 * Va aparte para poder probarla con `npm test`.
 */
import type { PedidoApi } from './pedidos'

export type EstadoReporte = 'Recibido' | 'En revisión' | 'Resuelto'
export const ESTADOS_REPORTE: EstadoReporte[] = ['Recibido', 'En revisión', 'Resuelto']

/** Clase de badge (definida en style.css) para cada estado. */
export const badgeReporte: Record<EstadoReporte, string> = {
  Recibido: 'badge-pendiente',
  'En revisión': 'badge-proceso',
  Resuelto: 'badge-finalizado',
}

export const MAX_RESPUESTA = 500

export interface ReporteApi {
  id_reporte: number
  id_pedido: number
  motivo: string
  descripcion: string
  estado: EstadoReporte
  respuesta: string | null
  fecha_creacion: string
  fecha_actualizacion: string | null
  usuario: { id_usuario: number; nombre: string; correo: string; telefono: string | null } | null
  pedido: PedidoApi | null
}

/** "R-0001" */
export const numeroReporte = (id: number): string => `R-${String(id).padStart(4, '0')}`

export const estaAbierto = (estado: EstadoReporte): boolean => estado !== 'Resuelto'

const limpiar = (t: string): string => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/** Búsqueda por número de reporte (R-0004), de pedido (#0004), cliente, correo o motivo. */
export function coincide(reporte: ReporteApi, texto: string): boolean {
  const q = limpiar(texto)
  if (!q) return true
  const reporteNum = /^r-?(\d+)$/.exec(q)
  if (reporteNum) return Number(reporteNum[1]) === reporte.id_reporte
  const pedidoNum = /^#(\d+)$/.exec(q)
  if (pedidoNum) return Number(pedidoNum[1]) === reporte.id_pedido
  return [reporte.usuario?.nombre ?? '', reporte.usuario?.correo ?? '', reporte.motivo].some((t) => limpiar(t).includes(q))
}

/** Cuántos reportes hay en cada estado (y el total en "Todos"). */
export function conteoPorEstado(lista: ReporteApi[]): Record<EstadoReporte | 'Todos', number> {
  const cuentas = { Todos: lista.length, Recibido: 0, 'En revisión': 0, Resuelto: 0 }
  for (const r of lista) cuentas[r.estado] += 1
  return cuentas
}

/** Qué falta para poder guardar (texto vacío si se puede guardar). */
export function validarCambio(estado: EstadoReporte, respuesta: string): string {
  const texto = respuesta.trim()
  if (texto.length > MAX_RESPUESTA) return `La respuesta puede tener hasta ${MAX_RESPUESTA} letras.`
  if (estado === 'Resuelto' && !texto) return 'Escribe una respuesta para el cliente antes de marcarlo como resuelto.'
  return ''
}

/** ¿Hay algo distinto a lo que ya está guardado? */
export function hayCambios(reporte: Pick<ReporteApi, 'estado' | 'respuesta'>, estado: EstadoReporte, respuesta: string): boolean {
  return estado !== reporte.estado || respuesta.trim() !== (reporte.respuesta ?? '')
}

const SUGERENCIAS: Record<string, string> = {
  'Limpieza incompleta': 'Lamentamos que la limpieza no haya quedado como esperabas. Volveremos a limpiar lo que falte sin costo; te escribimos para coordinar la fecha.',
  'Daño en mi pertenencia': 'Lamentamos lo ocurrido con tu pertenencia. Revisaremos lo que pasó con el equipo y te contactamos hoy para resolverlo.',
  'Llegaron tarde': 'Lamentamos la demora. Ya lo hablamos con el equipo para que no se repita. Gracias por avisarnos.',
  'Cobro incorrecto': 'Revisamos tu pedido y el cobro. Si hubo una diferencia, la ajustamos y te lo confirmamos por mensaje.',
  'Trato del personal': 'Lamentamos que el trato no haya sido el adecuado. Lo conversamos con el equipo y te contactamos para dar seguimiento.',
}
/** Respuesta de partida según el motivo, para que el equipo solo la ajuste. */
export const sugerenciaDe = (motivo: string): string =>
  SUGERENCIAS[motivo] ?? 'Gracias por avisarnos. Revisamos lo que pasó y te contactamos para resolverlo.'

/** "8 nov, 12:30" en hora de El Salvador; vacío si la fecha no es válida. */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return ''
  const f = new Date(iso)
  if (Number.isNaN(f.getTime())) return ''
  return f.toLocaleString('es-SV', { timeZone: 'America/El_Salvador', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}
