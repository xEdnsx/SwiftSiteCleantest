export const WA_NUMBER = '503XXXXXXXX'; // Sustituye con tu número real de WhatsApp.
export interface Servicio { id: string; nombre: string; nombreCompleto: string; nota: string; equipo: string[]; foto?: string; }
export const servicios: Servicio[] = [
 {id:'sillas',nombre:'Sillas',nombreCompleto:'Limpieza de sillas',nota:'Sillas empresariales, de comedor y más.',equipo:['Vapor','Succión','Secado con turbinas industriales']},
 {id:'muebles',nombre:'Muebles',nombreCompleto:'Limpieza de muebles',nota:'Juegos de sala, ottomans, butacas y tapicería de vehículos: cuero, tela y microfibra.',equipo:['Vapor','Succión','Secado con turbinas industriales'],foto:'Cojin de1 limpio.webp'},
 {id:'colchones',nombre:'Colchones',nombreCompleto:'Limpieza de colchones',nota:'De individual a king, por ambos lados. Ayuda a reducir ácaros y manchas.',equipo:['Vapor','Succión','Secado con turbinas industriales'],foto:'Colchon capri limpio.webp'},
 {id:'banos',nombre:'Baños',nombreCompleto:'Limpieza de baños',nota:'Desinfección y desincrustado de pisos, paredes, duchas y sanitarios.',equipo:['Vapor','Desinfección','Desincrustado'],foto:'Ducha azul limpia.webp'},
];
export const comparaciones = [
 {nombre:'Ducha',antes:'Ducha azul sucia.webp',despues:'Ducha azul limpia.webp'},
 {nombre:'Colchón',antes:'Colchon capri sucio.webp',despues:'Colchon capri limpio.webp'},
 {nombre:'Cojín',antes:'Cojin de1 sucio.webp',despues:'Cojin de1 limpio.webp'},
];
export const info = [
 {titulo:'Dónde atendemos', texto:'San Salvador Centro, Antiguo Cuscatlán, Nuevo Cuscatlán y Santa Tecla.',nota:'Domicilio gratis en estas zonas. Fuera de ellas aplica un recargo según el departamento o municipio.'},
 {titulo:'Horario de atención',texto:'Lunes a domingo, de 7:30 a. m. a 5:00 p. m.',nota:'Trabajamos con reserva: agenda con anticipación.'},
 {titulo:'Nuestra garantía',texto:'Garantía de servicio por humedad y mal olor.',nota:'Escríbenos y te explicamos cómo funciona.'},
 {titulo:'Cuidamos tu piel y tu hogar',texto:'No usamos lejía ni detergentes comerciales, que pueden afectar a personas con alergias en la piel.',nota:''},
];
export function whatsappUrl(servicio?: string, numero: string = WA_NUMBER): string | null {
 const normalizado = numero.replace(/[\s()+-]/g, '');
 if (!/^[1-9]\d{7,14}$/.test(normalizado)) return null;
 const texto = servicio ? `Hola SwiftSite Clean 👋\nMe interesa cotizar: ${servicio}` : 'Hola SwiftSite Clean 👋\nMe interesa cotizar un servicio de limpieza.';
 return `https://wa.me/${normalizado}?text=${encodeURIComponent(texto)}`;
}
export const foto = (nombre:string) => 'assets/fotos/' + encodeURIComponent(nombre);
