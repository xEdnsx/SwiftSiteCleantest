/**
 * Lógica pura de pedidos para el panel (sin Vue): tipos de la API y funciones de presentación.
 * Va aparte para poder probarla con `npm test`.
 */

export type EstadoPedido = 'Cotizado' | 'Confirmado' | 'En proceso' | 'Finalizado'

export const ESTADOS: EstadoPedido[] = ['Cotizado', 'Confirmado', 'En proceso', 'Finalizado']

/** Clase de badge (definida en style.css) para cada estado. */
export const badgePedido: Record<EstadoPedido, string> = {
  Cotizado: 'badge-cotizado',
  Confirmado: 'badge-confirmado',
  'En proceso': 'badge-proceso',
  Finalizado: 'badge-finalizado',
}

export interface LineaPedido {
  id_detalle: number
  id_tarifa: number
  tipo_item: string | null
  material: string | null
  cantidad: number
  precio_unitario: string
  subtotal: string
}

export interface PedidoApi {
  id_pedido: number
  estado: EstadoPedido
  fecha_servicio: string
  franja_horaria: string
  fecha_creacion: string
  direccion: string
  subtotal: string
  recargo_zona: string
  total: string
  zona: { id_zona: number; nombre: string } | null
  usuario: { id_usuario: number; nombre: string; correo: string; telefono: string | null } | null
  lineas: LineaPedido[]
  /** Solo vienen en la lista y el detalle del panel. */
  reportes?: { id_reporte: number; motivo: string; estado: 'Recibido' | 'En revisión' | 'Resuelto' }[]
  valoracion?: { id_valoracion: number; estrellas: number; estado: 'Pendiente' | 'Publicada' | 'Oculta' } | null
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export const numeroPedido = (id: number): string => `#${String(id).padStart(4, '0')}`
export const usd = (valor: string | number): string => `$${Number(valor).toFixed(2)}`

export function siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
  return ESTADOS[ESTADOS.indexOf(estado) + 1] ?? null
}
export function anteriorEstado(estado: EstadoPedido): EstadoPedido | null {
  const i = ESTADOS.indexOf(estado)
  return i > 0 ? (ESTADOS[i - 1] ?? null) : null
}

export function fechaISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

/** "Hoy · 10:00 a. m.", "Mañana · 8:00 a. m." o "Sáb 24 oct · 8:00 a. m.". */
export function fechaLegible(iso: string, franja: string, hoy: Date = new Date()): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  if (!anio || !mes || !dia) return franja
  const fecha = new Date(anio, mes - 1, dia)
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const dia_ =
    fechaISO(hoy) === iso ? 'Hoy' : fechaISO(manana) === iso ? 'Mañana' : `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${MESES[fecha.getMonth()]}`
  return `${dia_} · ${franja}`
}

/** "2 × Sofá 2 plazas · Cuero" */
export function textoLinea(linea: LineaPedido): string {
  const material = linea.material ? ` · ${linea.material}` : ''
  return `${linea.cantidad} × ${linea.tipo_item ?? 'Servicio'}${material}`
}

/** Resumen corto para la tabla: "Sofá 2 plazas ×2, Butaca" o "A, B y 3 más". */
export function resumenPedido(lineas: LineaPedido[]): string {
  const partes = lineas.map((l) => `${l.tipo_item ?? 'Servicio'}${l.cantidad > 1 ? ` ×${l.cantidad}` : ''}`)
  if (partes.length === 0) return '—'
  if (partes.length <= 2) return partes.join(', ')
  return `${partes[0]}, ${partes[1]} y ${partes.length - 2} más`
}

/** Enlace de WhatsApp (El Salvador, +503) o null si el teléfono no sirve. */
export function enlaceWhatsapp(telefono: string | null | undefined): string | null {
  const digitos = (telefono ?? '').replace(/\D/g, '')
  if (digitos.length === 8) return `https://wa.me/503${digitos}`
  if (digitos.length === 11 && digitos.startsWith('503')) return `https://wa.me/${digitos}`
  return null
}

/** Búsqueda por número (#0042 o 42), nombre o correo, sin importar mayúsculas ni tildes. */
export function coincide(pedido: PedidoApi, texto: string): boolean {
  const limpiar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const q = limpiar(texto)
  if (!q) return true
  const numero = q.replace(/^#/, '')
  if (/^\d+$/.test(numero) && Number(numero) === pedido.id_pedido) return true
  return [numeroPedido(pedido.id_pedido), pedido.usuario?.nombre ?? '', pedido.usuario?.correo ?? ''].some((t) => limpiar(t).includes(q))
}

/** Dinero con miles: $2,340.00 */
export const usdMiles = (valor: string | number): string =>
  Number(valor).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

/** Minutos desde medianoche de "10:00 a. m." / "2:00 p. m." (sirve para ordenar la agenda). */
export function minutosDeFranja(franja: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i.exec(franja.trim())
  if (!m) return 24 * 60
  const hora = Number(m[1]) % 12 + (m[3]!.toLowerCase() === 'p' ? 12 : 0)
  return hora * 60 + Number(m[2])
}

export const saludoPorHora = (hora: number): string => (hora < 12 ? 'Buen día' : hora < 19 ? 'Buenas tardes' : 'Buenas noches')

const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** "Jueves 5 de noviembre" */
export const fechaLargaEs = (fecha: Date): string =>
  `${DIAS_LARGOS[fecha.getDay()]} ${fecha.getDate()} de ${MESES_LARGOS[fecha.getMonth()]}`

/** Color del borde de cada cita de la agenda según el estado del pedido. */
export function colorAgenda(estado: EstadoPedido): 'aqua' | 'gota' | 'sol' {
  if (estado === 'Cotizado') return 'sol'
  if (estado === 'Finalizado') return 'aqua'
  return 'gota'
}
