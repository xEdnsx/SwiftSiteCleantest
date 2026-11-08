/**
 * Lógica pura de pedidos (sin Angular): tipos de la API y funciones para mostrarlos.
 * Va aparte para poder probarla con `npm test`.
 */

import type { EstadoReporte } from '../reportar/reportar';
import type { ValoracionDePedido } from '../valorar/valorar';

export type EstadoPedido = 'Cotizado' | 'Confirmado' | 'En proceso' | 'Finalizado';

export interface LineaPedidoApi {
  id_detalle: number;
  id_tarifa: number;
  tipo_item: string | null;
  material: string | null;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

export interface PedidoApi {
  id_pedido: number;
  estado: EstadoPedido;
  fecha_servicio: string;
  franja_horaria: string;
  fecha_creacion: string;
  direccion: string;
  subtotal: string;
  recargo_zona: string;
  total: string;
  zona: { id_zona: number; nombre: string } | null;
  lineas: LineaPedidoApi[];
  /** La valoración que ya envió la persona (null si todavía no valora). */
  valoracion?: ValoracionDePedido | null;
  /** Reportes que la persona envió de este pedido. */
  reportes?: { id_reporte: number; motivo: string; estado: EstadoReporte }[];
}

export interface NuevoPedido {
  id_zona: number;
  direccion: string;
  fecha_servicio: string;
  franja_horaria: string;
  items: { id_tarifa: number; cantidad: number }[];
}

/** Lo que muestra la pantalla "Mis pedidos". */
export interface PedidoVista {
  id: string;
  estado: EstadoPedido;
  titulo: string;
  fecha: string;
  zona: string;
  total: number;
  /** 1 = Cotizado, 2 = Confirmado, 3 = En proceso, 4 = Finalizado */
  progreso: number;
}

const ESTADOS: EstadoPedido[] = ['Cotizado', 'Confirmado', 'En proceso', 'Finalizado'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Horas que ofrece la pantalla de pedido → texto completo que se guarda. */
const FRANJAS: Record<string, string> = {
  '7:30': '7:30 a. m.',
  '10:00': '10:00 a. m.',
  '12:30': '12:30 p. m.',
  '2:00': '2:00 p. m.',
};

export const progresoDe = (estado: EstadoPedido): number => ESTADOS.indexOf(estado) + 1;
export const esActivo = (estado: EstadoPedido): boolean => estado !== 'Finalizado';
export const numeroPedido = (id: number): string => `#${String(id).padStart(4, '0')}`;
export const franjaDe = (hora: string): string => FRANJAS[hora] ?? hora;

/** Fecha local como AAAA-MM-DD (no usa UTC, para no correrse de día en la noche). */
export function fechaISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** "Hoy · 10:00 a. m.", "Mañana · 8:00 a. m." o "Sáb 24 oct · 8:00 a. m.". */
export function fechaLegible(iso: string, franja: string, hoy: Date = new Date()): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return franja;
  const fecha = new Date(anio, mes - 1, dia);
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  const hoyMismo = fechaISO(hoy) === iso;
  const esManana = fechaISO(manana) === iso;
  const dia_ = hoyMismo ? 'Hoy' : esManana ? 'Mañana' : `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${MESES[fecha.getMonth()]}`;
  return `${dia_} · ${franja}`;
}

/** "Sofá 2 plazas (cuero) ×2 y Butaca", o "A, B y 3 más" si son muchos. */
export function tituloPedido(lineas: LineaPedidoApi[]): string {
  const partes = lineas.map((l) => {
    const material = l.material ? ` (${l.material.toLowerCase()})` : '';
    const cantidad = l.cantidad > 1 ? ` ×${l.cantidad}` : '';
    return `${l.tipo_item ?? 'Servicio'}${material}${cantidad}`;
  });
  if (partes.length === 0) return 'Pedido';
  if (partes.length <= 2) return partes.join(' y ');
  return `${partes[0]}, ${partes[1]} y ${partes.length - 2} más`;
}

export function aVista(pedido: PedidoApi, hoy: Date = new Date()): PedidoVista {
  return {
    id: numeroPedido(pedido.id_pedido),
    estado: pedido.estado,
    titulo: tituloPedido(pedido.lineas),
    fecha: fechaLegible(pedido.fecha_servicio, pedido.franja_horaria, hoy),
    zona: pedido.zona?.nombre ?? '—',
    total: Number(pedido.total),
    progreso: progresoDe(pedido.estado),
  };
}
