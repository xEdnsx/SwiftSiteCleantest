/** Preguntas frecuentes. Las respuestas salen de lo que ya publica el negocio (data.ts y los Términos). */
import { info } from '../../data';

export interface PreguntaFrecuente { pregunta: string; respuesta: string; }

const dato = (titulo: string): string => info.find(i => i.titulo === titulo)?.texto ?? '';

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  { pregunta: '¿Cómo funciona la cotización?', respuesta: 'Eliges los servicios y cantidades en Cotizar y ves el precio al instante. Al enviar tu pedido, el sistema vuelve a calcular el total con los precios vigentes. Queda como "Cotizado" hasta que nuestro equipo lo confirma.' },
  { pregunta: '¿Dónde atienden?', respuesta: `${dato('Dónde atendemos')} Fuera de esas zonas aplica un recargo según el departamento o municipio, que ves en tu cotización.` },
  { pregunta: '¿Cuál es el horario?', respuesta: `${dato('Horario de atención')} Trabajamos con reserva: agenda con anticipación.` },
  { pregunta: '¿Tienen garantía?', respuesta: `${dato('Nuestra garantía')} Si notas alguno de esos problemas después del servicio, repórtalo desde Ayuda.` },
  { pregunta: '¿Qué productos usan?', respuesta: dato('Cuidamos tu piel y tu hogar') },
  { pregunta: '¿Cómo cambio o cancelo un pedido?', respuesta: 'Escríbenos por WhatsApp con la mayor anticipación posible para poder reasignar el horario.' },
  { pregunta: '¿Cómo pago?', respuesta: 'La aplicación no procesa pagos. La forma y el momento de pago se acuerdan al confirmar tu pedido.' },
];
