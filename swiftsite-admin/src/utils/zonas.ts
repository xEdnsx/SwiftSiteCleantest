/**
 * Zonas de cobertura (lógica pura del panel).
 *
 * La app del cliente solo reconoce una zona si se llama "<Departamento> <Región>" (por ejemplo "San Salvador Centro").
 * Para que nadie escriba el nombre a mano y se equivoque, el formulario del panel deja elegir departamento y región
 * y arma el nombre solo. Esta lista debe coincidir con la de la app (`pages/quote/zonas.ts`) y con `ZonasCoberturaSeeder`.
 */

export const REGIONES = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Costa'] as const

export const ORDEN_DEPARTAMENTOS = [
  'San Salvador', 'La Libertad', 'Cuscatlán', 'La Paz', 'Cabañas', 'San Vicente', 'Sonsonate',
  'Santa Ana', 'Ahuachapán', 'Chalatenango', 'Usulután', 'San Miguel', 'Morazán', 'La Unión',
]

/** Distritos (antiguos municipios) que incluye cada zona. Solo se muestran como referencia; el precio sale de la API. */
export const DISTRITOS: Record<string, string[]> = {
  'Ahuachapán Norte': ['Atiquizaya', 'El Refugio', 'San Lorenzo', 'Turín'],
  'Ahuachapán Centro': ['Ahuachapán', 'Apaneca', 'Concepción de Ataco', 'Tacuba'],
  'Ahuachapán Sur': ['Guaymango', 'Jujutla', 'San Francisco Menéndez', 'San Pedro Puxtla'],
  'San Salvador Norte': ['Aguilares', 'El Paisnal', 'Guazapa'],
  'San Salvador Oeste': ['Apopa', 'Nejapa'],
  'San Salvador Este': ['Ilopango', 'San Martín', 'Soyapango', 'Tonacatepeque'],
  'San Salvador Centro': ['San Salvador', 'Mejicanos', 'Cuscatancingo', 'Ciudad Delgado', 'Ayutuxtepeque'],
  'San Salvador Sur': ['Panchimalco', 'Rosario de Mora', 'San Marcos', 'Santo Tomás', 'Santiago Texacuangos'],
  'La Libertad Norte': ['Quezaltepeque', 'San Matías', 'San Pablo Tacachico'],
  'La Libertad Centro': ['San Juan Opico', 'Ciudad Arce'],
  'La Libertad Oeste': ['Colón', 'Jayaque', 'Sacacoyo', 'Tepecoyo', 'Talnique'],
  'La Libertad Este': ['Antiguo Cuscatlán', 'Nuevo Cuscatlán', 'Huizúcar', 'San José Villanueva', 'Zaragoza'],
  'La Libertad Costa': ['La Libertad', 'Chiltiupán', 'Jicalapa', 'Tamanique', 'Teotepeque'],
  'La Libertad Sur': ['Santa Tecla', 'Comasagua'],
  'Chalatenango Norte': ['La Palma', 'Citalá', 'San Ignacio'],
  'Chalatenango Centro': ['Nueva Concepción', 'Tejutla', 'La Reina', 'Agua Caliente', 'Dulce Nombre de María', 'El Paraíso', 'San Fernando', 'San Francisco Morazán', 'San Rafael', 'Santa Rita'],
  'Chalatenango Sur': ['Chalatenango', 'Arcatao', 'Azacualpa', 'Comalapa', 'Concepción Quezaltepeque', 'El Carrizal', 'La Laguna', 'Las Vueltas', 'Nombre de Jesús', 'Nueva Trinidad', 'Ojos de Agua', 'Potonico', 'San Antonio de La Cruz', 'San Antonio Los Ranchos', 'San Francisco Lempa', 'San Isidro Labrador', 'San José Cancasque', 'San Miguel de Mercedes', 'San José Las Flores', 'San Luis del Carmen'],
  'Cuscatlán Norte': ['Suchitoto', 'San José Guayabal', 'Oratorio de Concepción', 'San Bartolomé Perulapía', 'San Pedro Perulapán'],
  'Cuscatlán Sur': ['Cojutepeque', 'San Rafael Cedros', 'Candelaria', 'Monte San Juan', 'El Carmen', 'San Cristóbal', 'Santa Cruz Michapa', 'San Ramón', 'El Rosario', 'Santa Cruz Analquito', 'Tenancingo'],
  'Cabañas Este': ['Sensuntepeque', 'Victoria', 'Dolores', 'Guacotecti', 'San Isidro'],
  'Cabañas Oeste': ['Ilobasco', 'Tejutepeque', 'Jutiapa', 'Cinquera'],
  'La Paz Oeste': ['Cuyultitán', 'Olocuilta', 'San Juan Talpa', 'San Luis Talpa', 'San Pedro Masahuat', 'Tapalhuaca', 'San Francisco Chinameca'],
  'La Paz Centro': ['El Rosario', 'Jerusalén', 'Mercedes La Ceiba', 'Paraíso de Osorio', 'San Antonio Masahuat', 'San Emigdio', 'San Juan Tepezontes', 'San Luis La Herradura', 'San Miguel Tepezontes', 'San Pedro Nonualco', 'Santa María Ostuma', 'Santiago Nonualco'],
  'La Paz Este': ['San Juan Nonualco', 'San Rafael Obrajuelo', 'Zacatecoluca'],
  'La Unión Norte': ['Anamorós', 'Bolívar', 'Concepción de Oriente', 'El Sauce', 'Lislique', 'Nueva Esparta', 'Pasaquina', 'Polorós', 'San José La Fuente', 'Santa Rosa de Lima'],
  'La Unión Sur': ['Conchagua', 'El Carmen', 'Intipucá', 'La Unión', 'Meanguera del Golfo', 'San Alejo', 'Yayantique', 'Yucuaiquín'],
  'Usulután Norte': ['Santiago de María', 'Alegría', 'Berlín', 'Mercedes Umaña', 'Jucuapa', 'El Triunfo', 'Estanzuelas', 'San Buenaventura', 'Nueva Granada'],
  'Usulután Este': ['Usulután', 'Jucuarán', 'San Dionisio', 'Concepción Batres', 'Santa María', 'Ozatlán', 'Tecapán', 'Santa Elena', 'California', 'Ereguayquín'],
  'Usulután Oeste': ['Jiquilisco', 'Puerto El Triunfo', 'San Agustín', 'San Francisco Javier'],
  'Sonsonate Norte': ['Juayúa', 'Nahuizalco', 'Salcoatitán', 'Santa Catarina Masahuat'],
  'Sonsonate Centro': ['Sonsonate', 'Sonzacate', 'Nahulingo', 'San Antonio del Monte', 'Santo Domingo de Guzmán'],
  'Sonsonate Este': ['Izalco', 'Armenia', 'Caluco', 'San Julián', 'Cuisnahuat', 'Santa Isabel Ishuatán'],
  'Sonsonate Oeste': ['Acajutla'],
  'Santa Ana Norte': ['Masahuat', 'Metapán', 'Santa Rosa Guachipilín', 'Texistepeque'],
  'Santa Ana Centro': ['Santa Ana'],
  'Santa Ana Este': ['Coatepeque', 'El Congo'],
  'Santa Ana Oeste': ['Candelaria de la Frontera', 'Chalchuapa', 'El Porvenir', 'San Antonio Pajonal', 'San Sebastián Salitrillo', 'Santiago de La Frontera'],
  'San Vicente Norte': ['Apastepeque', 'Santa Clara', 'San Ildefonso', 'San Esteban Catarina', 'San Sebastián', 'San Lorenzo', 'Santo Domingo'],
  'San Vicente Sur': ['San Vicente', 'Guadalupe', 'Verapaz', 'Tepetitán', 'Tecoluca', 'San Cayetano Istepeque'],
  'San Miguel Norte': ['Ciudad Barrios', 'Sesori', 'Nuevo Edén de San Juan', 'San Gerardo', 'San Luis de La Reina', 'Carolina', 'San Antonio del Mosco', 'Chapeltique'],
  'San Miguel Centro': ['San Miguel', 'Comacarán', 'Uluazapa', 'Moncagua', 'Quelepa', 'Chirilagua'],
  'San Miguel Oeste': ['Chinameca', 'Nueva Guadalupe', 'Lolotique', 'San Jorge', 'San Rafael Oriente', 'El Tránsito'],
  'Morazán Norte': ['Arambala', 'Cacaopera', 'Corinto', 'El Rosario', 'Joateca', 'Jocoaitique', 'Meanguera', 'Perquín', 'San Fernando', 'San Isidro', 'Torola'],
  'Morazán Sur': ['Chilanga', 'Delicias de Concepción', 'El Divisadero', 'Gualococti', 'Guatajiagua', 'Jocoro', 'Lolotiquillo', 'Osicala', 'San Carlos', 'San Francisco Gotera', 'San Simón', 'Sensembra', 'Sociedad', 'Yamabal', 'Yoloaiquín'],
}

const limpiar = (t: string): string => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/** Regiones que existen en un departamento, en el orden en que se ofrecen. */
export function regionesDe(departamento: string): string[] {
  const existentes = new Set(
    Object.keys(DISTRITOS)
      .filter((nombre) => nombre.startsWith(`${departamento} `))
      .map((nombre) => nombre.slice(departamento.length + 1)),
  )
  return REGIONES.filter((r) => existentes.has(r))
}

/** "San Salvador" + "Centro" → "San Salvador Centro"; vacío si falta alguno. */
export const nombreZona = (departamento: string, region: string): string =>
  departamento && region ? `${departamento} ${region}` : ''

/** Separa "San Salvador Centro" en departamento y región; null si el nombre no sigue el formato. */
export function separarNombre(nombre: string): { departamento: string; region: string } | null {
  const buscado = limpiar(nombre)
  for (const departamento of ORDEN_DEPARTAMENTOS) {
    for (const region of regionesDe(departamento)) {
      if (limpiar(nombreZona(departamento, region)) === buscado) return { departamento, region }
    }
  }
  return null
}

/** Distritos que cubre una zona (vacío si no se conoce). */
export const distritosDe = (departamento: string, region: string): string[] => DISTRITOS[nombreZona(departamento, region)] ?? []

/** ¿Ya hay otra zona con ese nombre? `propios` son los nombres de las demás zonas (sin la que se edita). */
export const yaExiste = (nombre: string, propios: string[]): boolean => !!nombre && propios.some((p) => limpiar(p) === limpiar(nombre))

// ---------- Vista por departamentos (lógica pura de la pantalla de zonas) ----------

/** Zona tal como la entrega la API. */
export interface ZonaApi {
  id_zona: number
  nombre: string
  recargo: string
  activo: boolean
}

export interface ZonaDeDepartamento {
  zona: ZonaApi
  region: string
  distritos: string[]
}

export type EstadoDepartamento = 'todas' | 'algunas' | 'ninguna'

export interface ResumenDepartamento {
  departamento: string
  zonas: ZonaDeDepartamento[]
  activas: number
  /** Si todas las zonas están encendidas, algunas, o ninguna. */
  estado: EstadoDepartamento
  recargoMin: number
  recargoMax: number
}

export interface ZonasAgrupadas {
  /** Los 14 departamentos (los que no tienen zonas en la base salen con la lista vacía). */
  departamentos: ResumenDepartamento[]
  /** Zonas de la base cuyo nombre la app no reconoce (no siguen «Departamento Región»). */
  sinReconocer: ZonaApi[]
  /** Zonas que la app espera y que no existen en esta base (por ejemplo, si no se corrió el seeder). */
  faltan: string[]
}

/** Todas las zonas que la app espera, con su nombre completo: «San Salvador Centro», «La Libertad Costa»… */
export const ZONAS_ESPERADAS: string[] = ORDEN_DEPARTAMENTOS.flatMap((d) => regionesDe(d).map((r) => nombreZona(d, r)))

/** Agrupa las zonas por departamento, en el orden de la app y con las regiones en su orden habitual. */
export function agruparPorDepartamento(zonas: ZonaApi[]): ZonasAgrupadas {
  const porDepartamento = new Map<string, ZonaDeDepartamento[]>(ORDEN_DEPARTAMENTOS.map((d) => [d, []]))
  const sinReconocer: ZonaApi[] = []
  const encontradas = new Set<string>()

  for (const zona of zonas) {
    const partes = separarNombre(zona.nombre)
    if (!partes) {
      sinReconocer.push(zona)
      continue
    }
    encontradas.add(limpiar(zona.nombre))
    porDepartamento.get(partes.departamento)!.push({ zona, region: partes.region, distritos: distritosDe(partes.departamento, partes.region) })
  }

  const departamentos = ORDEN_DEPARTAMENTOS.map((departamento): ResumenDepartamento => {
    const lista = porDepartamento.get(departamento)!.sort((a, b) => REGIONES.indexOf(a.region as never) - REGIONES.indexOf(b.region as never))
    const activas = lista.filter((z) => z.zona.activo).length
    const recargos = lista.map((z) => Number(z.zona.recargo))
    return {
      departamento,
      zonas: lista,
      activas,
      estado: activas === 0 ? 'ninguna' : activas === lista.length ? 'todas' : 'algunas',
      recargoMin: recargos.length ? Math.min(...recargos) : 0,
      recargoMax: recargos.length ? Math.max(...recargos) : 0,
    }
  })

  return { departamentos, sinReconocer, faltan: ZONAS_ESPERADAS.filter((n) => !encontradas.has(limpiar(n))) }
}

/** Zonas que se encenderían al reactivar un departamento: las que hoy están apagadas. */
export const zonasQueSeEnciendenAlReactivar = (resumen: ResumenDepartamento): ZonaDeDepartamento[] =>
  resumen.zonas.filter((z) => !z.zona.activo)

/** Zonas que se apagarían al desactivar un departamento: las que hoy están encendidas. */
export const zonasQueSeApaganAlDesactivar = (resumen: ResumenDepartamento): ZonaDeDepartamento[] =>
  resumen.zonas.filter((z) => z.zona.activo)

/** «3 de 5 zonas activas», «Todas las zonas activas», «Sin zonas activas». */
export function textoActivas(resumen: Pick<ResumenDepartamento, 'zonas' | 'activas'>): string {
  const total = resumen.zonas.length
  if (total === 0) return 'Sin zonas en la base'
  if (resumen.activas === total) return total === 1 ? 'Zona activa' : `Las ${total} zonas activas`
  if (resumen.activas === 0) return 'Sin zonas activas'
  return `${resumen.activas} de ${total} zonas activas`
}

/** «$0.00», «$3.00» o «$5.00 a $12.00». */
export function textoRecargo(min: number, max: number): string {
  const d = (n: number) => `$${n.toFixed(2)}`
  return min === max ? d(min) : `${d(min)} a ${d(max)}`
}

/** El recargo que escribió la persona, como número con dos decimales; null si no es válido (vacío, negativo, texto…). */
export function recargoValido(valor: unknown): number | null {
  const texto = String(valor ?? '').trim().replace(',', '.')
  if (texto === '' || !/^\d+(\.\d{1,2})?$/.test(texto)) return null
  const n = Number(texto)
  return n <= 99999999.99 ? Math.round(n * 100) / 100 : null
}

/** Cuántas de las zonas que la app reconoce están activas (las zonas viejas con otro nombre no cuentan). */
export function conteoDeZonas(g: ZonasAgrupadas): { activas: number; total: number } {
  const reconocidas = g.departamentos.flatMap((d) => d.zonas)
  return { activas: reconocidas.filter((z) => z.zona.activo).length, total: reconocidas.length }
}

/** Zonas con nombre desconocido que siguen activas: las únicas que vale la pena avisar (las desactivadas ya no estorban). */
export const sinReconocerActivas = (g: ZonasAgrupadas): ZonaApi[] => g.sinReconocer.filter((z) => z.activo)
