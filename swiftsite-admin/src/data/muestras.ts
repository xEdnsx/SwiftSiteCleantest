/**
 * Datos de EJEMPLO de los mockups.
 * Sirven para las pantallas que todavía no consumen la API (Pedidos, Clientes,
 * Valoraciones y el Dashboard). Al conectar cada endpoint, reemplazar estos
 * arrays por la respuesta de la API (ver services/api.ts).
 */

export type EstadoPedido = 'Cotizado' | 'Confirmado' | 'En proceso' | 'Finalizado'

/** Clase de badge (definida en style.css) para cada estado de pedido. */
export const badgePedido: Record<EstadoPedido, string> = {
  Cotizado: 'badge-cotizado',
  Confirmado: 'badge-confirmado',
  'En proceso': 'badge-proceso',
  Finalizado: 'badge-finalizado',
}

export interface PedidoMuestra {
  numero: string
  cliente: string
  servicio: string
  fecha: string
  total: number
  estado: EstadoPedido
  telefono: string
  correo: string
  direccion: string
  lineas: { detalle: string; importe: number }[]
  recargo: number
}

export const pedidos: PedidoMuestra[] = [
  { numero: '#0047', cliente: 'María Hernández', servicio: 'Sillas ×6', fecha: 'Vie 23 oct · 8:00', total: 48, estado: 'Cotizado',
    telefono: '7000-1111', correo: 'maria@correo.com', direccion: 'San Salvador · Col. Escalón, calle 3',
    lineas: [{ detalle: 'Sillas de comedor ×6', importe: 48 }], recargo: 0 },
  { numero: '#0045', cliente: 'Carlos Rivas', servicio: 'Colchón matrimonial', fecha: 'Sáb 24 oct · 8:00', total: 35, estado: 'Confirmado',
    telefono: '7222-3333', correo: 'carlos@correo.com', direccion: 'Antiguo Cuscatlán · Urb. Madreselva',
    lineas: [{ detalle: 'Colchón matrimonial ×1', importe: 35 }], recargo: 0 },
  { numero: '#0042', cliente: 'Ana Martínez', servicio: 'Sofá 3 puestos ×2, butaca', fecha: 'Hoy · 10:00', total: 120, estado: 'En proceso',
    telefono: '7777-0000', correo: 'ana@correo.com', direccion: 'Santa Tecla · Col. Utila, calle 5, casa 12',
    lineas: [{ detalle: 'Sofá 3 puestos, tela ×2', importe: 90 }, { detalle: 'Butaca, cuero ×1', importe: 30 }], recargo: 0 },
  { numero: '#0041', cliente: 'Luis Portillo', servicio: 'Baño completo', fecha: 'Hoy · 7:30', total: 40, estado: 'Finalizado',
    telefono: '7555-4444', correo: 'luis@correo.com', direccion: 'Nuevo Cuscatlán · Res. Los Pinos',
    lineas: [{ detalle: 'Baño completo ×1', importe: 40 }], recargo: 0 },
  { numero: '#0040', cliente: 'Sofía Amaya', servicio: 'Tapicería de vehículo', fecha: 'Hoy · 1:00', total: 65, estado: 'Finalizado',
    telefono: '7888-5555', correo: 'sofia@correo.com', direccion: 'San Salvador · Col. Médica',
    lineas: [{ detalle: 'Tapicería de vehículo ×1', importe: 65 }], recargo: 0 },
  { numero: '#0039', cliente: 'Rosa Menjívar', servicio: 'Sofá 3 puestos', fecha: 'Mié 14 oct · 2:00', total: 75, estado: 'Finalizado',
    telefono: '7333-6666', correo: 'rosa@correo.com', direccion: 'Soyapango · Col. Santa Lucía',
    lineas: [{ detalle: 'Sofá 3 puestos, cuero ×1', importe: 70 }], recargo: 5 },
  { numero: '#0038', cliente: 'Jorge Alas', servicio: 'Sillas de comedor ×4', fecha: 'Mar 13 oct · 10:00', total: 30, estado: 'Finalizado',
    telefono: '7444-7777', correo: 'jorge@correo.com', direccion: 'San Salvador · Col. Flor Blanca',
    lineas: [{ detalle: 'Sillas de comedor ×4', importe: 30 }], recargo: 0 },
]

export interface AgendaMuestra { hora: string; cliente: string; detalle: string; color: 'aqua' | 'gota' | 'sol' }

export const agendaHoy: AgendaMuestra[] = [
  { hora: '7:30', cliente: 'Luis Portillo', detalle: 'Baño completo · Nuevo Cuscatlán', color: 'aqua' },
  { hora: '10:00', cliente: 'Ana Martínez', detalle: 'Sofás y butaca · Santa Tecla', color: 'gota' },
  { hora: '1:00', cliente: 'Sofía Amaya', detalle: 'Tapicería de vehículo · San Salvador', color: 'aqua' },
  { hora: '3:30', cliente: 'Carlos Rivas', detalle: 'Colchón matrimonial · Por confirmar', color: 'sol' },
]

export interface ClienteMuestra { id: number; nombre: string; telefono: string; correo: string; zona: string; pedidos: number }

export const clientes: ClienteMuestra[] = [
  { id: 1, nombre: 'María Hernández', telefono: '7000-1111', correo: 'maria@correo.com', zona: 'San Salvador', pedidos: 3 },
  { id: 2, nombre: 'Ana Martínez', telefono: '7777-0000', correo: 'ana@correo.com', zona: 'Santa Tecla', pedidos: 2 },
  { id: 3, nombre: 'Carlos Rivas', telefono: '7222-3333', correo: 'carlos@correo.com', zona: 'Antiguo Cusc.', pedidos: 1 },
  { id: 4, nombre: 'Luis Portillo', telefono: '7555-4444', correo: 'luis@correo.com', zona: 'Nuevo Cusc.', pedidos: 4 },
  { id: 5, nombre: 'Sofía Amaya', telefono: '7888-5555', correo: 'sofia@correo.com', zona: 'San Salvador', pedidos: 2 },
  { id: 6, nombre: 'Rosa Menjívar', telefono: '7333-6666', correo: 'rosa@correo.com', zona: 'Soyapango', pedidos: 1 },
]

export type EstadoValoracion = 'Pendiente' | 'Publicada' | 'Oculta'

export interface ValoracionMuestra { id: number; cliente: string; servicio: string; estrellas: number; comentario: string; estado: EstadoValoracion }

export const valoraciones: ValoracionMuestra[] = [
  { id: 1, cliente: 'Ana Martínez', servicio: 'Sofá 3 puestos', estrellas: 5, comentario: 'Quedó como nuevo y llegaron puntuales.', estado: 'Pendiente' },
  { id: 2, cliente: 'Luis Portillo', servicio: 'Baño completo', estrellas: 5, comentario: 'Muy buen trabajo, el sarro salió todo.', estado: 'Publicada' },
  { id: 3, cliente: 'Sofía Amaya', servicio: 'Tapicería de vehículo', estrellas: 5, comentario: 'Mi carro quedó oliendo increíble.', estado: 'Publicada' },
  { id: 4, cliente: 'Carlos Rivas', servicio: 'Colchón matrimonial', estrellas: 4, comentario: 'Bien, pero llegaron 20 minutos tarde.', estado: 'Pendiente' },
  { id: 5, cliente: 'Rosa Menjívar', servicio: 'Sillas de comedor ×6', estrellas: 5, comentario: 'Las sillas se ven como nuevas.', estado: 'Publicada' },
  { id: 6, cliente: 'Jorge Alas', servicio: 'Butaca', estrellas: 3, comentario: 'Quedó una mancha pequeña.', estado: 'Oculta' },
]

export const badgeValoracion: Record<EstadoValoracion, string> = {
  Pendiente: 'badge-pendiente',
  Publicada: 'badge-confirmado',
  Oculta: 'badge-cotizado',
}

/** Formato de dinero de los mockups: $48.00 */
export const usd = (n: number) => `$${n.toFixed(2)}`
