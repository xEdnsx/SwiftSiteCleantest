import { iconoDeCategoria, normalizarNombre } from './servicios'

/**
 * Sugerencias para el formulario de tarifas, según lo que se va a limpiar.
 * Solo ahorran escribir: el administrador puede tocar una opción o escribir la suya.
 * No llevan precios (eso lo decide el negocio).
 */
export interface SugerenciasTarifa {
  /** Artículos habituales (paso 2). */
  articulos: string[]
  /** Materiales, tamaños o tipos habituales (paso 3). Vacío si en esa categoría el precio no cambia por eso. */
  materiales: string[]
  /** Pista del nombre de un artículo nuevo. */
  ejemploArticulo: string
  /** Pista del nombre de un material o tamaño nuevo. */
  ejemploMaterial: string
  /** Pista del «Detalle corto». */
  detalle: string
  /** Pista de «Qué incluye». */
  incluye: string
}

const SUGERENCIAS: Record<string, SugerenciasTarifa> = {
  pisos: {
    articulos: ['Piso de Cerámica', 'Piso de Porcelanato', 'Piso de Madera / Laminado', 'Piso de Cemento Pulido'],
    materiales: ['Tránsito Residencial', 'Tránsito Alto', 'Interiores', 'Exteriores / Terrazas'],
    ejemploArticulo: 'Ej. Piso de Cerámica',
    ejemploMaterial: 'Ej. Tránsito Alto',
    detalle: 'Ej. Tarifa válida para áreas despejadas.',
    incluye: 'Ej. Incluye lavado profundo con máquina rotativa, remoción de suciedad en juntas y zócalos.',
  },
  colchones: {
    articulos: ['Colchón Individual', 'Colchón Matrimonial', 'Colchón Queen', 'Colchón King'],
    materiales: [],
    ejemploArticulo: 'Ej. Colchón Individual',
    ejemploMaterial: 'Ej. Ortopédico',
    detalle: 'Ej. 90 × 190 cm',
    incluye: 'Ej. Aspirado profundo por ambos lados y tratamiento antiácaros.',
  },
  muebles: {
    articulos: ['Sofá 2 plazas', 'Sofá 3 plazas', 'Butaca', 'Seccional'],
    materiales: ['Tela', 'Microfibra', 'Cuero', 'Cuero sintético'],
    ejemploArticulo: 'Ej. Sofá 2 plazas',
    ejemploMaterial: 'Ej. Terciopelo',
    detalle: 'Ej. Cojines incluidos.',
    incluye: 'Ej. Aspirado, lavado de la tapicería con extracción y desodorizado.',
  },
  sillas: {
    articulos: ['Silla · solo asiento', 'Silla · asiento y respaldo', 'Silla de oficina', 'Silla de comedor'],
    materiales: ['Tela', 'Malla', 'Cuero', 'Piel sintética'],
    ejemploArticulo: 'Ej. Silla de oficina',
    ejemploMaterial: 'Ej. Piel sintética',
    detalle: 'Ej. Precio por silla.',
    incluye: 'Ej. Aspirado y lavado de asiento y respaldo.',
  },
  banos: {
    articulos: ['Baño completo', 'Baño social', 'Baño de servicio', 'Ducha / Tina'],
    materiales: ['Pequeño', 'Mediano', 'Grande', 'Extra grande'],
    ejemploArticulo: 'Ej. Baño completo',
    ejemploMaterial: 'Ej. Extra grande',
    detalle: 'Ej. Hasta 4 m².',
    incluye: 'Ej. Desinfección de sanitario, lavamanos, ducha, azulejos y piso.',
  },
  alfombras: {
    articulos: ['Alfombra de pared a pared', 'Alfombra decorativa', 'Tapete', 'Alfombra de oficina'],
    materiales: ['Sintética', 'Lana', 'Pelo corto', 'Pelo largo'],
    ejemploArticulo: 'Ej. Alfombra decorativa',
    ejemploMaterial: 'Ej. Pelo largo',
    detalle: 'Ej. Tarifa por m².',
    incluye: 'Ej. Aspirado, lavado con extracción y secado.',
  },
  cisterna: {
    articulos: ['Cisterna enterrada', 'Tanque elevado', 'Pila'],
    materiales: ['Hasta 1,000 L', '1,000 a 5,000 L', 'Más de 5,000 L'],
    ejemploArticulo: 'Ej. Cisterna enterrada',
    ejemploMaterial: 'Ej. Hasta 2,000 L',
    detalle: 'Ej. Incluye el agua de enjuague.',
    incluye: 'Ej. Vaciado, lavado a presión, desinfección y enjuague.',
  },
  ventanas: {
    articulos: ['Ventana corrediza', 'Ventana fija', 'Ventanal', 'Puerta de vidrio'],
    materiales: ['Pequeña', 'Mediana', 'Grande'],
    ejemploArticulo: 'Ej. Ventana corrediza',
    ejemploMaterial: 'Ej. Grande',
    detalle: 'Ej. Por dentro y por fuera.',
    incluye: 'Ej. Limpieza de vidrio, marcos y rieles.',
  },
  cocina: {
    articulos: ['Estufa', 'Campana extractora', 'Horno', 'Cocina completa'],
    materiales: ['Pequeña', 'Mediana', 'Grande'],
    ejemploArticulo: 'Ej. Campana extractora',
    ejemploMaterial: 'Ej. Grande',
    detalle: 'Ej. Desengrase profundo.',
    incluye: 'Ej. Desengrase de quemadores, parrillas y superficies.',
  },
  auto: {
    articulos: ['Auto sedán', 'Camioneta / SUV', 'Pick-up', 'Moto'],
    materiales: ['Tela', 'Cuero'],
    ejemploArticulo: 'Ej. Camioneta / SUV',
    ejemploMaterial: 'Ej. Cuero',
    detalle: 'Ej. Interior completo.',
    incluye: 'Ej. Aspirado, lavado de asientos y tapetes, y limpieza del tablero.',
  },
  jardin: {
    articulos: ['Jardín', 'Patio', 'Terraza', 'Cochera'],
    materiales: ['Concreto', 'Césped', 'Piedra / Adoquín'],
    ejemploArticulo: 'Ej. Terraza',
    ejemploMaterial: 'Ej. Concreto',
    detalle: 'Ej. Tarifa por m².',
    incluye: 'Ej. Barrido, lavado a presión y retiro de maleza.',
  },
  limpieza: {
    articulos: ['Limpieza general de casa', 'Limpieza de oficina', 'Limpieza post-construcción', 'Limpieza de apartamento'],
    materiales: ['Pequeño', 'Mediano', 'Grande'],
    ejemploArticulo: 'Ej. Limpieza de oficina',
    ejemploMaterial: 'Ej. Mediano',
    detalle: 'Ej. Hasta 100 m².',
    incluye: 'Ej. Limpieza de pisos, baños, cocina y superficies.',
  },
}

/** Sugerencias de una categoría (por su ícono o su nombre), o null si no hay para ella. */
export function sugerenciasDe(categoria?: { nombre?: string | null; icono?: string | null }): SugerenciasTarifa | null {
  return SUGERENCIAS[iconoDeCategoria(categoria)] ?? null
}

/**
 * Forma de comparar nombres sin que importen mayúsculas, tildes, puntos medios ni «de»:
 * «Sofá 2 plazas» y «Sofá de 2 plazas» son el mismo artículo.
 */
export function claveComparable(texto: string): string {
  return normalizarNombre(texto)
    .replace(/[·/,.-]/g, ' ')
    .replace(/\bde\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** El existente que equivale a la sugerencia (para tocarla y usar el que ya está), o undefined. */
export function existenteDe(sugerencia: string, existentes: string[]): string | undefined {
  const clave = claveComparable(sugerencia)
  return existentes.find((e) => claveComparable(e) === clave)
}
