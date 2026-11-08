/**
 * Lógica pura del perfil (sin Angular): iniciales, estadísticas, validación de formularios
 * y fuerza de contraseña. Va aparte para poder probarla con `npm test`.
 * Las reglas de contraseña y teléfono son las mismas que valida la API (PerfilController).
 */

export function iniciales(nombre: string | null | undefined): string {
  const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primera = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primera + ultima).toLocaleUpperCase('es');
}

export interface EstadisticasPerfil {
  /** Servicios que ya se contrataron: confirmados, en proceso y finalizados (no cuenta cotizaciones). */
  contratados: number;
  finalizados: number;
  enCurso: number;
}

/** Conteos de la tarjeta del perfil a partir de los pedidos reales de la persona. */
export function estadisticas(pedidos: { estado: string }[]): EstadisticasPerfil {
  return {
    contratados: pedidos.filter(p => p.estado !== 'Cotizado').length,
    finalizados: pedidos.filter(p => p.estado === 'Finalizado').length,
    enCurso: pedidos.filter(p => p.estado === 'Confirmado' || p.estado === 'En proceso').length,
  };
}

/** Direcciones distintas que la persona ya usó en sus pedidos, de la más reciente a la más antigua. */
export function direccionesUsadas(pedidos: { direccion: string; fecha_creacion: string }[]): string[] {
  const vistas = new Set<string>();
  const resultado: string[] = [];
  const ordenados = [...pedidos].sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));
  for (const pedido of ordenados) {
    const direccion = pedido.direccion.trim().replace(/\s+/g, ' ');
    // La API reemplaza la dirección por este texto al anonimizar: no es una dirección real.
    if (!direccion || /eliminada por el titular/i.test(direccion)) continue;
    const clave = direccion.toLocaleLowerCase('es');
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    resultado.push(direccion);
  }
  return resultado;
}

export const TELEFONO_REGEX = /^[0-9+\-\s()]{7,25}$/;

export interface ErroresDatos { nombre?: string; telefono?: string; }

export function validarDatos(nombre: string, telefono: string): ErroresDatos {
  const errores: ErroresDatos = {};
  const n = nombre.trim();
  if (n.length < 2) errores.nombre = 'Escribe tu nombre (mínimo 2 letras).';
  else if (n.length > 120) errores.nombre = 'El nombre es demasiado largo.';
  const t = telefono.trim();
  if (t && !TELEFONO_REGEX.test(t)) errores.telefono = 'Usa solo números, espacios, + - ( ) (7 a 25 caracteres).';
  return errores;
}

export interface EvaluacionClave {
  largo: boolean;
  mayuscula: boolean;
  numero: boolean;
  /** Cumple los tres requisitos (y no pasa de 72 caracteres, límite de la API). */
  valida: boolean;
  /** 0 = vacía, 1 = débil, 2 = media, 3 = fuerte */
  nivel: 0 | 1 | 2 | 3;
  etiqueta: string;
}

export function evaluarClave(clave: string): EvaluacionClave {
  const largo = clave.length >= 8;
  const mayuscula = /[A-Z]/.test(clave);
  const numero = /[0-9]/.test(clave);
  const valida = largo && mayuscula && numero && clave.length <= 72;
  if (!clave) return { largo, mayuscula, numero, valida: false, nivel: 0, etiqueta: '' };
  // Fuerte: cumple todo y además es larga (12+) o tiene símbolo.
  const extra = clave.length >= 12 || /[^A-Za-z0-9]/.test(clave);
  const nivel: 1 | 2 | 3 = valida ? (extra ? 3 : 2) : 1;
  return { largo, mayuscula, numero, valida, nivel, etiqueta: ['', 'Débil', 'Media', 'Fuerte'][nivel] };
}

export interface ErroresClave { actual?: string; nueva?: string; confirmacion?: string; }

export function validarCambioClave(actual: string, nueva: string, confirmacion: string): ErroresClave {
  const errores: ErroresClave = {};
  if (!actual) errores.actual = 'Escribe tu contraseña actual.';
  if (!evaluarClave(nueva).valida) errores.nueva = 'La nueva contraseña debe tener 8 o más caracteres, una mayúscula y un número.';
  else if (nueva === actual) errores.nueva = 'La nueva contraseña debe ser distinta de la actual.';
  if (nueva !== confirmacion) errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}

export function hayErrores(errores: object): boolean {
  return Object.keys(errores).length > 0;
}
