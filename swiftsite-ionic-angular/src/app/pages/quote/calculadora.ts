/**
 * Lógica pura de la calculadora de precios (sin Angular, fácil de probar).
 *
 * El catálogo llega de la API como una lista plana de tarifas. Convención (ver TarifasItemsSeeder):
 *   - tipo_item = qué se limpia (primera pregunta).
 *   - material  = variante que cambia el precio (segunda pregunta): material o tamaño.
 *   - "Extra: …" = extras opcionales, se cobran por unidad.
 * Así, un servicio o una tarifa nueva en el admin aparece en la calculadora sin tocar el código:
 * hasta el ícono, las preguntas y las notas vienen de la base de datos (ver ConfigCategoria).
 */
import type { Categoria, Tarifa } from '../../core/catalogos.service';
import type { IconName } from '../../shared/icon.component';

export const CANTIDAD_MIN = 1;
/** Tope por defecto; cada servicio puede tener el suyo (p. ej. metros cuadrados). */
export const CANTIDAD_MAX = 99;

// ----------------------------------------------------------------- utilidades
export const esExtra = (t: Tarifa): boolean => t.tipo_item.trim().toLowerCase().startsWith('extra:');
export const precio = (t: Tarifa | undefined): number => (t ? Number(t.precio_unitario) : 0);
const redondear = (n: number): number => Math.round(n * 100) / 100;
/** Los importes llegan como texto ("90.00"): se muestran con $ y 2 decimales. */
export const dinero = (valor: number | string): string => '$' + Number(valor).toFixed(2);
export const normalizar = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
export const nombreExtra = (t: Tarifa): string => t.tipo_item.replace(/^extra:\s*/i, '').trim().toLowerCase();

// ----------------------------------------------------------------- presentación por categoría
/**
 * Íconos que la app sabe dibujar. El panel ofrece esta misma lista al crear un servicio;
 * si llega uno que no está aquí se usa el genérico ("servicio").
 */
export const ICONOS_SERVICIO = [
  'servicio', 'sillas', 'muebles', 'colchones', 'banos', 'pisos', 'cisterna', 'ventanas', 'alfombras', 'cocina', 'auto', 'jardin', 'limpieza',
] as const satisfies readonly IconName[];

export function iconoValido(nombre: string | null | undefined): IconName {
  const clave = (nombre ?? '').trim().toLowerCase();
  return (ICONOS_SERVICIO as readonly string[]).includes(clave) ? (clave as IconName) : 'servicio';
}

/** Cómo se presenta una categoría. Todo sale de la base de datos; lo que falte tiene un texto genérico. */
export interface ConfigCategoria {
  icono: IconName;
  preguntaTipo: string;
  preguntaVariante: string;
  preguntaCantidad: string;
  etiquetaCantidad: string;
  /** Aviso bajo las opciones (vacío si no hay). */
  nota: string;
  cantidadMax: number;
}

const texto = (valor: string | null | undefined): string => (valor ?? '').trim();

export function configDe(categoria: Categoria): ConfigCategoria {
  const max = Number(categoria.cantidad_max);
  return {
    icono: iconoValido(categoria.icono),
    preguntaTipo: texto(categoria.pregunta_tipo) || '¿Qué necesitas?',
    preguntaVariante: texto(categoria.pregunta_variante) || 'Opciones',
    preguntaCantidad: texto(categoria.pregunta_cantidad) || '¿Cuántos?',
    etiquetaCantidad: texto(categoria.unidad) || 'Unidades',
    nota: texto(categoria.nota),
    cantidadMax: Number.isFinite(max) && max >= 1 ? Math.min(Math.trunc(max), 10000) : CANTIDAD_MAX,
  };
}

/** Pocas opciones se ven mejor como tarjetas; muchas, como botones compactos. */
export const estiloDeTipos = (cantidad: number): 'chips' | 'tarjetas' => (cantidad <= 4 ? 'tarjetas' : 'chips');

// ----------------------------------------------------------------- estructura de preguntas
export interface Tipo {
  /** tipo_item tal como viene de la API. */
  nombre: string;
  /** Nombre para mostrar (con la primera letra en mayúscula). */
  etiqueta: string;
  /** Texto corto bajo la opción (solo si el tipo tiene una única variante). */
  subtitulo: string;
  /** Qué incluye / qué es (vacío si no hace falta). */
  descripcion: string;
  /** Tarifas de este tipo, de la más barata a la más cara. */
  variantes: Tarifa[];
  desde: number;
}
export interface Estructura { tipos: Tipo[]; extras: Tarifa[]; }

/** "Silla · solo asiento" se muestra como "Solo asiento": lo que va después del " · ". */
export function etiquetaTipo(nombre: string): string {
  const i = nombre.indexOf(' · ');
  const corto = (i >= 0 ? nombre.slice(i + 3) : nombre).trim() || nombre.trim();
  return corto.charAt(0).toUpperCase() + corto.slice(1);
}

export function estructura(idCategoria: number, tarifas: Tarifa[]): Estructura {
  const propias = tarifas.filter((t) => t.id_categoria === idCategoria && t.activo);
  const grupos = new Map<string, Tarifa[]>();
  for (const t of propias.filter((x) => !esExtra(x))) {
    const lista = grupos.get(t.tipo_item) ?? [];
    lista.push(t);
    grupos.set(t.tipo_item, lista);
  }
  const tipos: Tipo[] = [...grupos.entries()].map(([nombre, lista]) => {
    const variantes = [...lista].sort((a, b) => precio(a) - precio(b) || a.id_tarifa - b.id_tarifa);
    return {
      nombre,
      etiqueta: etiquetaTipo(nombre),
      subtitulo: variantes.length === 1 ? texto(variantes[0]?.detalle) : '',
      descripcion: variantes.map((v) => texto(v.descripcion)).find(Boolean) ?? '',
      variantes,
      desde: precio(variantes[0]),
    };
  });
  return { tipos, extras: propias.filter(esExtra) };
}

// ----------------------------------------------------------------- la lista de la persona
export interface LineaLista {
  id_categoria: number;
  categoria: string;
  icono: IconName | null;
  tarifa: Tarifa;
  extras: Tarifa[];
  cantidad: number;
}

export const unitario = (l: LineaLista): number => redondear(precio(l.tarifa) + l.extras.reduce((a, e) => a + precio(e), 0));
export const importe = (l: LineaLista): number => redondear(unitario(l) * l.cantidad);
export const subtotalLocal = (lineas: LineaLista[]): number => redondear(lineas.reduce((a, l) => a + importe(l), 0));
export const acotarCantidad = (n: number, max: number = CANTIDAD_MAX): number => Math.min(max, Math.max(CANTIDAD_MIN, Math.trunc(n) || CANTIDAD_MIN));

/** Nombre completo del servicio ("Colchón queen", "Silla · asiento y respaldo") para que la lista se entienda sola. */
export const tituloLinea = (l: LineaLista): string => l.tarifa.tipo_item;

/** "Cuero · 6 × $10.00 + antiácaros $5.00" */
export function detalleLinea(l: LineaLista): string {
  const base = l.tarifa.material ? `${l.tarifa.material} · ` : '';
  const extras = l.extras.map((e) => ` + ${nombreExtra(e)} ${dinero(precio(e))}`).join('');
  return `${base}${l.cantidad} × ${dinero(precio(l.tarifa))}${extras}`;
}

/**
 * Convierte la lista en los ítems que espera POST /cotizaciones/preliminar.
 * La API exige id_tarifa distintos, así que si una tarifa se repite se suman las cantidades.
 * Los extras se cobran por cada unidad de su servicio.
 */
export function itemsApi(lineas: LineaLista[]): { id_tarifa: number; cantidad: number }[] {
  const total = new Map<number, number>();
  const sumar = (id: number, n: number) => total.set(id, Math.min(10000, (total.get(id) ?? 0) + n));
  for (const l of lineas) {
    sumar(l.tarifa.id_tarifa, l.cantidad);
    for (const e of l.extras) sumar(e.id_tarifa, l.cantidad);
  }
  return [...total.entries()].map(([id_tarifa, cantidad]) => ({ id_tarifa, cantidad }));
}

/** Pone al día la lista guardada con el catálogo actual: precios nuevos y sin tarifas que ya no existen. */
export function reconciliar(lineas: LineaLista[], tarifas: Tarifa[]): LineaLista[] {
  const porId = new Map(tarifas.filter((t) => t.activo).map((t) => [t.id_tarifa, t] as const));
  const out: LineaLista[] = [];
  for (const l of lineas) {
    const tarifa = porId.get(l.tarifa.id_tarifa);
    if (!tarifa) continue;
    const extras = l.extras.map((e) => porId.get(e.id_tarifa)).filter((e): e is Tarifa => !!e);
    out.push({ ...l, tarifa, extras });
  }
  return out;
}
