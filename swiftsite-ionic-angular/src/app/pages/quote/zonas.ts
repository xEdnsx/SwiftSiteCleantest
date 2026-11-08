/**
 * Zonas de cobertura por departamento (lógica pura).
 *
 * Desde 2024 El Salvador tiene 44 municipios (Norte, Centro, Sur…) que agrupan a los antiguos municipios, ahora "distritos".
 * La API guarda cada zona como una fila con nombre "<Departamento> <Zona>" (p. ej. "San Salvador Centro") y su recargo.
 * Aquí se separan en departamento + zona y se muestran los distritos que incluye, porque la gente conoce
 * "Soyapango" pero no sabe que ahora cae en "San Salvador Este".
 * Fuente de la lista: Ley de reestructuración municipal (diario El Mundo, 2024).
 */
import type { Zona } from '../../core/catalogos.service';

export const REGIONES = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Costa'] as const;

export const ORDEN_DEPARTAMENTOS = [
  'San Salvador', 'La Libertad', 'Cuscatlán', 'La Paz', 'Cabañas', 'San Vicente', 'Sonsonate',
  'Santa Ana', 'Ahuachapán', 'Chalatenango', 'Usulután', 'San Miguel', 'Morazán', 'La Unión',
];

/** Distritos (antiguos municipios) que incluye cada zona. Solo presentación: el precio y el id vienen de la API. */
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
};

export interface ZonaInfo {
  zona: Zona;
  departamento: string;
  /** "Centro", "Norte"… (o el nombre completo si la zona no sigue el formato). */
  region: string;
  distritos: string[];
  gratis: boolean;
}
export interface Departamento { nombre: string; zonas: ZonaInfo[]; }

const OTRAS = 'Otras zonas';

export function infoZona(zona: Zona): ZonaInfo {
  const nombre = zona.nombre.trim();
  const region = REGIONES.find((r) => nombre.endsWith(' ' + r));
  const departamento = region ? nombre.slice(0, nombre.length - region.length - 1) : OTRAS;
  return { zona, departamento, region: region ?? nombre, distritos: DISTRITOS[nombre] ?? [], gratis: Number(zona.recargo) === 0 };
}

/** Solo cuentan las zonas de los 14 departamentos. Las que no siguen el formato "<Departamento> <Zona>" (zonas viejas) no se ofrecen. */
export function zonasVigentes(zonas: Zona[]): Zona[] {
  return zonas.filter((z) => ORDEN_DEPARTAMENTOS.includes(infoZona(z).departamento));
}

/** Agrupa las zonas por departamento (en orden geográfico) y dentro de cada uno ordena Centro, Norte, Sur, Este, Oeste, Costa. */
export function agruparPorDepartamento(zonas: Zona[]): Departamento[] {
  const grupos = new Map<string, ZonaInfo[]>();
  for (const z of zonasVigentes(zonas)) {
    const info = infoZona(z);
    grupos.set(info.departamento, [...(grupos.get(info.departamento) ?? []), info]);
  }
  const rangoRegion = (r: string): number => { const i = (REGIONES as readonly string[]).indexOf(r); return i === -1 ? 999 : i; };
  return ORDEN_DEPARTAMENTOS
    .filter((nombre) => grupos.has(nombre))
    .map((nombre) => ({ nombre, zonas: [...grupos.get(nombre)!].sort((a, b) => rangoRegion(a.region) - rangoRegion(b.region)) }));
}

/** Todos los municipios de la zona en una sola línea: "Soyapango, Ilopango y San Martín". */
export function listaDistritos(info: ZonaInfo): string {
  const d = info.distritos;
  if (d.length <= 1) return d[0] ?? '';
  return `${d.slice(0, -1).join(', ')} y ${d[d.length - 1]}`;
}
