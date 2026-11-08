/**
 * Lógica pura de "Reportar un problema" (sin Angular): tipos de la API y validaciones.
 * Va aparte para poder probarla con `npm test`.
 */

export const MOTIVOS = [
  'Limpieza incompleta',
  'Daño en mi pertenencia',
  'Llegaron tarde',
  'Cobro incorrecto',
  'Trato del personal',
  'Otro',
] as const;
export type MotivoReporte = (typeof MOTIVOS)[number];
export type EstadoReporte = 'Recibido' | 'En revisión' | 'Resuelto';

export const DESCRIPCION_MIN = 10;
export const DESCRIPCION_MAX = 500;

export interface ReporteApi {
  id_reporte: number;
  id_pedido: number;
  motivo: MotivoReporte;
  descripcion: string;
  estado: EstadoReporte;
  respuesta: string | null;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
}

export interface NuevoReporte {
  id_pedido: number;
  motivo: MotivoReporte;
  descripcion: string;
}

/** "R-0001" */
export const numeroReporte = (id: number): string => `R-${String(id).padStart(4, '0')}`;

/** Quita espacios sobrantes y compacta saltos de línea repetidos. */
export const limpiarDescripcion = (texto: string): string => texto.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

export interface EstadoFormulario { valido: boolean; falta: string; }

/** Qué le falta al formulario para poder enviarse (texto vacío si está completo). */
export function estadoFormulario(motivo: MotivoReporte | null, descripcion: string): EstadoFormulario {
  if (!motivo) return { valido: false, falta: 'Elige qué pasó.' };
  const largo = limpiarDescripcion(descripcion).length;
  if (largo < DESCRIPCION_MIN) return { valido: false, falta: `Cuéntanos un poco más (mínimo ${DESCRIPCION_MIN} letras).` };
  if (largo > DESCRIPCION_MAX) return { valido: false, falta: `Máximo ${DESCRIPCION_MAX} letras.` };
  return { valido: true, falta: '' };
}

/** Línea de contacto del aviso: "7777-0000 y ana@correo.com". */
export function contactoDe(telefono: string | null | undefined, correo: string | null | undefined): string {
  return [telefono, correo].map((x) => (x ?? '').trim()).filter(Boolean).join(' y ');
}

// ----- Lo que se está reportando -----

/** "Silla · asiento y respaldo" → "silla". Es el nombre corto del servicio, tal como lo escribió el catálogo. */
export function nombreCorto(tipoItem: string | null | undefined): string {
  const base = (tipoItem ?? '').split(' · ')[0]!.trim();
  return base ? base.charAt(0).toLowerCase() + base.slice(1) : '';
}

export interface CosaReportada {
  /** "tu silla" o, si el pedido mezcla varios servicios, "tu pedido". */
  texto: string;
  /** true si es un solo servicio (se puede hablar de "tu silla"). */
  especifica: boolean;
}

/** Qué cosa se limpió, a partir de las líneas del pedido. */
export function cosaDelPedido(lineas: { tipo_item: string | null }[]): CosaReportada {
  const nombres = new Set(lineas.map((l) => nombreCorto(l.tipo_item)).filter(Boolean));
  if (nombres.size === 1) return { texto: `tu ${[...nombres][0]}`, especifica: true };
  return { texto: 'tu pedido', especifica: false };
}

/** Pregunta que guía la descripción según el motivo elegido. */
export function preguntaGuia(motivo: MotivoReporte | null, cosa: CosaReportada): string {
  switch (motivo) {
    case 'Limpieza incompleta':
      return cosa.especifica ? `¿Qué parte de ${cosa.texto} quedó sin limpiar?` : '¿Qué quedó sin limpiar o mal limpiado?';
    case 'Daño en mi pertenencia':
      return cosa.especifica ? `¿Le pasó algo a ${cosa.texto} o a otra cosa tuya? Cuéntanos qué se dañó.` : '¿Qué se dañó durante el servicio? Cuéntanos qué cosa fue.';
    case 'Llegaron tarde':
      return '¿A qué hora llegaron y a qué hora los esperabas?';
    case 'Cobro incorrecto':
      return '¿Cuánto te cobraron y cuánto esperabas pagar?';
    case 'Trato del personal':
      return '¿Qué pasó con el trato? Cuéntanos qué ocurrió.';
    case 'Otro':
      return `Cuéntanos qué pasó con ${cosa.texto}.`;
    default:
      return '';
  }
}

/** Ejemplo gris dentro del campo de texto. */
export function ejemploDe(motivo: MotivoReporte | null, cosa: CosaReportada): string {
  const algo = cosa.especifica ? cosa.texto : 'el servicio';
  switch (motivo) {
    case 'Limpieza incompleta': return `Ej. Quedó una mancha en ${algo}.`;
    case 'Daño en mi pertenencia': return `Ej. ${algo.charAt(0).toUpperCase() + algo.slice(1)} quedó con un rasguño.`;
    case 'Llegaron tarde': return 'Ej. Llegaron a las 11:00 y la cita era a las 9:00.';
    case 'Cobro incorrecto': return 'Ej. Me cobraron $40 y la cotización decía $35.';
    case 'Trato del personal': return 'Ej. Fueron groseros cuando les pedí que repitieran una parte.';
    default: return 'Escribe aquí los detalles.';
  }
}

// ----- Reporte que ya existe del mismo pedido -----

/** Reporte de este pedido que todavía no se resuelve (si existe, no se puede enviar otro). */
export function reporteAbierto(reportes: ReporteApi[], idPedido: number): ReporteApi | null {
  return reportes.find((r) => r.id_pedido === idPedido && r.estado !== 'Resuelto') ?? null;
}

/** Último reporte resuelto de este pedido (el más reciente), para mostrar la respuesta del equipo. */
export function reporteResuelto(reportes: ReporteApi[], idPedido: number): ReporteApi | null {
  const resueltos = reportes.filter((r) => r.id_pedido === idPedido && r.estado === 'Resuelto');
  return resueltos.reduce<ReporteApi | null>((ultimo, r) => (!ultimo || r.id_reporte > ultimo.id_reporte ? r : ultimo), null);
}

/** Texto del enlace de Mis pedidos: "Reportar problema" o el estado del último reporte del pedido. */
export function textoEnlaceReporte(reportes: { id_reporte: number; estado: EstadoReporte }[] | undefined): string {
  if (!reportes?.length) return 'Reportar problema';
  const ultimo = reportes.reduce((a, b) => (b.id_reporte > a.id_reporte ? b : a));
  return `Mi reporte: ${ultimo.estado}`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** "8 nov" a partir de la fecha ISO que manda la API. */
export function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${MESES[d.getMonth()]}`;
}
