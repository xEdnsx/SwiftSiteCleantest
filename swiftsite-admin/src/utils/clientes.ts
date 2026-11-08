/**
 * Lógica pura de clientes para el panel (sin Vue): tipos de la API, validación y presentación.
 * Va aparte para poder probarla con `npm test`.
 */
import type { PedidoApi } from './pedidos'

export interface ClienteApi {
  id_usuario: number
  nombre: string
  telefono: string | null
  /** Opcional: hay clientes que solo tienen teléfono. */
  correo: string | null
  /** true si el cliente ya tiene contraseña (puede entrar a la app). */
  tiene_acceso: boolean
  pedidos_count: number
  servicios_finalizados: number
  total_gastado: string
  ultimo_pedido: string | null
}

export interface PerfilCliente extends ClienteApi {
  pedidos: PedidoApi[]
}

export interface FormCliente {
  nombre: string
  telefono: string
  correo: string
}

const TELEFONO = /^[0-9+\-\s()]{7,25}$/
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Devuelve el primer problema del formulario, o '' si todo está bien (mismas reglas que la API). */
export function validarCliente(form: FormCliente): string {
  const nombre = form.nombre.trim()
  const telefono = form.telefono.trim()
  const correo = form.correo.trim()
  if (nombre.length < 2) return 'Escribe el nombre del cliente.'
  if (nombre.length > 120) return 'El nombre es demasiado largo (máximo 120 letras).'
  if (telefono && !TELEFONO.test(telefono)) return 'El teléfono solo puede llevar números, espacios, + y guiones (mínimo 7 dígitos).'
  if (correo && !CORREO.test(correo)) return 'Ese correo no parece válido; revisa que tenga la forma nombre@correo.com, o déjalo vacío.'
  if (correo.length > 150) return 'El correo es demasiado largo.'
  if (!telefono && !correo) return 'Escribe al menos un teléfono o un correo para poder contactar al cliente.'
  return ''
}

/** Cuerpo para la API: teléfono y correo vacíos se envían como null para poder borrarlos. */
export function cuerpoCliente(form: FormCliente) {
  return {
    nombre: form.nombre.trim(),
    telefono: form.telefono.trim() || null,
    correo: form.correo.trim().toLowerCase() || null,
  }
}

/**
 * Aviso que acompaña al formulario: qué pasará con la cuenta de la persona en la app según los datos que se tengan.
 * Vacío mientras no haya ni teléfono ni correo.
 */
export function avisoDeAcceso(form: FormCliente, yaTieneCuenta = false): string {
  const correo = form.correo.trim()
  if (yaTieneCuenta) return 'Esta persona ya tiene cuenta en la app. Su correo es con el que entra: si lo cambias, tendrá que usar el nuevo.'
  if (correo) return 'Todavía no puede entrar a la app. Cuando cree su cuenta con este mismo correo, quedará ligada a este perfil.'
  if (form.telefono.trim()) return 'Sin correo no podrá entrar a la app. Cuando quiera pedir, dile que cree su cuenta desde la app (puede usar este teléfono).'
  return ''
}

/** "MH" para "María Hernández". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primera = partes[0]!.charAt(0)
  const ultima = partes.length > 1 ? partes[partes.length - 1]!.charAt(0) : ''
  return (primera + ultima).toUpperCase()
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "Hoy", "Ayer", "Hace 3 días" o "12 oct 2026" para la fecha ISO de un pedido; "—" si no hay. */
export function haceTiempo(iso: string | null, ahora: Date = new Date()): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((inicioDia(ahora) - inicioDia(fecha)) / 86_400_000)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 30) return `Hace ${dias} días`
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
}

/** Búsqueda por nombre, correo o teléfono, sin importar mayúsculas ni tildes. */
export function coincideCliente(cliente: ClienteApi, texto: string): boolean {
  const limpiar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const q = limpiar(texto)
  if (!q) return true
  const solo = (t: string) => t.replace(/\D/g, '')
  if (/^[\d\s-]+$/.test(q) && solo(q) && solo(cliente.telefono ?? '').includes(solo(q))) return true
  return [cliente.nombre, cliente.correo ?? '', cliente.telefono ?? ''].some((t) => limpiar(t).includes(q))
}

/** Frase corta que resume la actividad de un cliente, para el perfil. */
export function resumenActividad(cliente: Pick<ClienteApi, 'pedidos_count' | 'servicios_finalizados'>): string {
  if (cliente.pedidos_count === 0) return 'Aún no ha hecho pedidos.'
  const pedidos = `${cliente.pedidos_count} ${cliente.pedidos_count === 1 ? 'pedido' : 'pedidos'}`
  const servicios = `${cliente.servicios_finalizados} ${cliente.servicios_finalizados === 1 ? 'servicio terminado' : 'servicios terminados'}`
  return `${pedidos} · ${servicios}`
}
