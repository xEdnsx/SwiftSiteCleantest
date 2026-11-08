export const WA_NUMBER = '503XXXXXXXX'; // Sustituye con tu número real de WhatsApp.
/**
 * Fotos decorativas del Inicio, por nombre de servicio (sin tildes, en minúsculas).
 * Los servicios salen de la base de datos; si uno nuevo no tiene foto aquí, se muestra su ícono.
 */
export const FOTOS_SERVICIO: Record<string, string> = {
 muebles: 'Cojin de1 limpio.webp',
 colchones: 'Colchon capri limpio.webp',
 banos: 'Ducha azul limpia.webp',
};
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
/** Enlace de WhatsApp con un mensaje libre (p. ej. para reportar un problema). null si el número aún es el de ejemplo. */
export function whatsappMensaje(texto: string, numero: string = WA_NUMBER): string | null {
 const normalizado = numero.replace(/[\s()+-]/g, '');
 if (!/^[1-9]\d{7,14}$/.test(normalizado)) return null;
 return `https://wa.me/${normalizado}?text=${encodeURIComponent(texto)}`;
}
export const foto = (nombre:string) => 'assets/fotos/' + encodeURIComponent(nombre);
