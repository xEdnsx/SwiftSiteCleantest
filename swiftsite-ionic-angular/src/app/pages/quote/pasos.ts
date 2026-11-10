/**
 * Los pasos de hacer un pedido, en el orden en que la persona los recorre.
 * Los dos primeros viven en «Cotizar» y los otros dos en «Tu pedido»; las dos pantallas
 * muestran esta misma lista para que se note que es un solo proceso.
 */
export const PASOS_PEDIDO = ['Elige', 'Zona y total', 'Agenda', 'Resumen'] as const;

/** Cuántos pasos se recorren en «Cotizar» antes de llegar a «Tu pedido». */
export const PASOS_EN_COTIZAR = 2;

/** Número de paso (1 a 4) que corresponde al paso 1 o 2 de la pantalla «Tu pedido». */
export const numeroDePaso = (pasoEnPedido: number): number => PASOS_EN_COTIZAR + pasoEnPedido;
