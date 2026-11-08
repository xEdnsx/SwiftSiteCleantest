/**
 * Textos legales de SwiftSite Clean (Términos de uso y Aviso de privacidad).
 * Lógica pura, sin Angular, para poder probarla con `npm test`.
 *
 * IMPORTANTE:
 *  - LEGAL_VERSION debe ser igual a `config('legal.version')` de la API (hay una prueba que lo vigila).
 *    Cuando cambies el contenido de los textos, sube la versión en los dos lugares.
 *  - Los datos del negocio (NEGOCIO) deben completarse antes de publicar. Mientras falten,
 *    la página muestra "[Completar: ...]" para que no pase desapercibido.
 *  - Este texto es una base de trabajo, NO es asesoría legal: debe revisarlo un abogado.
 */

export const LEGAL_VERSION = '2026-11-08';
export const LEGAL_FECHA = '8 de noviembre de 2026';

/** Datos del responsable. Complétalos con los reales (null = pendiente). */
export interface DatosNegocio {
  /** Nombre o razón social de quien presta el servicio (persona natural o sociedad). */
  responsable: string | null;
  /** Domicilio para notificaciones. */
  domicilio: string | null;
  /** Correo para solicitudes de datos personales. */
  correo: string | null;
  /** Número de WhatsApp de atención, solo para mostrarlo (el enlace sale de data.ts). */
  telefono: string | null;
}

/**
 * Datos del negocio. El domicilio es el real de ITCA-FEPADE (Sede Central); los teléfonos son los
 * de la sede. El correo usa el dominio reservado `.example` (ficticio). Si el negocio llega a operar,
 * reemplázalos por los reales (o pon null para que la página muestre "[Completar: ...]").
 */
export const NEGOCIO: DatosNegocio = {
  responsable: 'SwiftSite Clean (proyecto académico de ITCA-FEPADE)',
  domicilio:
    'Km 11.5, carretera a Santa Tecla, distrito de Santa Tecla, municipio de La Libertad Sur, departamento de La Libertad, El Salvador (ITCA-FEPADE, Sede Central)',
  correo: 'privacidad@swiftsiteclean.example',
  telefono: '7854-2983',
};

/** Datos cortos para el pie de página (solo se muestran, no son legales). */
export const CONTACTO = {
  ubicacion: 'Km 11.5, carretera a Santa Tecla, La Libertad',
  horario: 'Lun a dom · 7:30 a. m. a 5:00 p. m.',
  fijos: '2132-7400 / 2132-7551',
};

export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
  lista?: string[];
}

export type TipoLegal = 'terminos' | 'privacidad';

/** Devuelve el dato, o un marcador visible si todavía no se ha completado. */
export function dato(valor: string | null, etiqueta: string): string {
  const limpio = valor?.trim();
  return limpio ? limpio : `[Completar: ${etiqueta}]`;
}

/** Nombres de los datos del negocio que aún faltan (para avisarte antes de publicar). */
export function datosPendientes(negocio: DatosNegocio = NEGOCIO): string[] {
  const nombres: Record<keyof DatosNegocio, string> = {
    responsable: 'nombre o razón social del responsable',
    domicilio: 'domicilio',
    correo: 'correo de contacto',
    telefono: 'teléfono de atención',
  };
  return (Object.keys(nombres) as (keyof DatosNegocio)[])
    .filter(clave => !negocio[clave]?.trim())
    .map(clave => nombres[clave]);
}

export function titulo(tipo: TipoLegal): string {
  return tipo === 'terminos' ? 'Términos de uso' : 'Aviso de privacidad';
}

export function secciones(tipo: TipoLegal, negocio: DatosNegocio = NEGOCIO): SeccionLegal[] {
  return tipo === 'terminos' ? terminos(negocio) : privacidad(negocio);
}

function contacto(negocio: DatosNegocio): string {
  return `Correo: ${dato(negocio.correo, 'correo de contacto')}. WhatsApp: ${dato(negocio.telefono, 'teléfono de atención')}.`;
}

function terminos(n: DatosNegocio): SeccionLegal[] {
  return [
    {
      titulo: '1. Quiénes somos y qué aceptas',
      parrafos: [
        `SwiftSite Clean es un servicio de limpieza profunda a domicilio (muebles, colchones, baños y otros servicios) prestado por ${dato(n.responsable, 'nombre o razón social del responsable')}, con domicilio en ${dato(n.domicilio, 'domicilio')}.`,
        'Al crear una cuenta o usar la aplicación aceptas estos términos y el Aviso de privacidad. Si no estás de acuerdo, puedes cotizar como invitado sin crear cuenta, pero no podrás confirmar pedidos.',
      ],
    },
    {
      titulo: '2. Tu cuenta',
      parrafos: ['Para confirmar pedidos necesitas una cuenta. Eres responsable de lo que se haga con ella.'],
      lista: [
        'Debes dar datos verdaderos y mantenerlos actualizados desde "Mi perfil".',
        'Debes ser mayor de edad para crear una cuenta y contratar.',
        'Guarda tu contraseña con cuidado y no la compartas. Si crees que alguien más la conoce, cámbiala desde "Mi perfil".',
        'Puedes eliminar tu cuenta cuando quieras desde "Mi perfil", salvo que tengas pedidos en curso.',
      ],
    },
    {
      titulo: '3. Cotizaciones y pedidos',
      parrafos: [
        'La función Cotizar te da un precio estimado según los servicios, cantidades y zona que elijas. Al enviar tu pedido, el sistema vuelve a calcular el total con los precios vigentes, y ese es el monto que prevalece.',
        'Un pedido queda como "Cotizado" hasta que el equipo de SwiftSite Clean lo confirma. Solo desde ese momento el servicio queda agendado. Puede que te contactemos para coordinar o ajustar la fecha y la franja horaria.',
        'Los precios incluyen el domicilio en las zonas de cobertura gratuita; fuera de ellas se suma el recargo indicado en tu cotización.',
      ],
    },
    {
      titulo: '4. Cancelaciones y cambios',
      parrafos: [
        'Si necesitas cancelar o reprogramar, avísanos con la mayor anticipación posible por WhatsApp para poder reasignar el horario.',
        'Una vez que el pedido está "En proceso" ya hay personal en camino o trabajando en tu domicilio, por lo que los cambios dependen de lo que sea posible en ese momento.',
      ],
    },
    {
      titulo: '5. Garantía',
      parrafos: [
        'Damos garantía de servicio por humedad y mal olor. Si después del servicio notas alguno de esos problemas, escríbenos y lo revisamos. La garantía no cubre daños anteriores al servicio ni el desgaste normal de los materiales.',
      ],
    },
    {
      titulo: '6. Pagos',
      parrafos: [
        'La aplicación no procesa pagos. La forma y el momento de pago se acuerdan al confirmar el pedido.',
      ],
    },
    {
      titulo: '7. Tu parte',
      parrafos: ['Para poder prestar el servicio, te pedimos:'],
      lista: [
        'Indicar una dirección correcta y que alguien pueda recibirnos en la fecha y franja elegidas.',
        'Avisarnos de condiciones especiales de los artículos (por ejemplo, manchas antiguas, telas delicadas o alergias).',
        'No usar la aplicación para fines ilegales, ni intentar acceder a cuentas o datos de otras personas.',
      ],
    },
    {
      titulo: '8. Tus valoraciones y opiniones',
      parrafos: [
        'Cuando un servicio termina puedes valorarlo con estrellas y, si quieres, con un comentario. Al enviar una valoración aceptas lo siguiente:',
      ],
      lista: [
        'Revisamos las valoraciones y decidimos cuáles mostramos. Podemos mostrar opiniones positivas y también críticas, y podemos dejar de mostrar cualquiera cuando queramos. Enviar una valoración no garantiza que se muestre.',
        'Las que mostramos aparecen en el Inicio de la aplicación, visibles para cualquier persona que la use, con las estrellas, el comentario, los aspectos que marcaste, el mes y tu nombre con la inicial de tu apellido (por ejemplo, Ana M.). Nunca mostramos tu correo, teléfono ni dirección.',
        'No escribas insultos ni datos personales de otras personas en tu comentario. Podemos no mostrar lo que sea ofensivo, falso o que revele datos ajenos.',
        'Puedes pedirnos que dejemos de mostrar una opinión tuya escribiéndonos. Si eliminas tu cuenta, el comentario de tus valoraciones se borra.',
      ],
    },
    {
      titulo: '9. Responsabilidad',
      parrafos: [
        'Hacemos el trabajo con el cuidado debido. Los resultados dependen del estado previo de cada artículo, por lo que no podemos garantizar la eliminación total de manchas muy antiguas o daños de fábrica. Nuestra responsabilidad se limita a lo que establezca la ley aplicable.',
        'La aplicación puede estar temporalmente fuera de servicio por mantenimiento o fallas; haremos lo posible por resolverlo rápido.',
      ],
    },
    {
      titulo: '10. Propiedad intelectual',
      parrafos: [
        'El nombre, logotipo, diseño, textos y fotografías de SwiftSite Clean pertenecen a su titular. No puedes copiarlos ni usarlos sin autorización.',
      ],
    },
    {
      titulo: '11. Cambios a estos términos',
      parrafos: [
        'Podemos actualizar estos términos. Cuando el cambio sea importante te lo avisaremos en la aplicación y, si es necesario, te pediremos aceptar de nuevo. La versión vigente y su fecha aparecen al inicio de esta página.',
      ],
    },
    {
      titulo: '12. Ley aplicable y contacto',
      parrafos: [
        'Estos términos se rigen por las leyes de la República de El Salvador.',
        `Para dudas o reclamos: ${contacto(n)}`,
      ],
    },
  ];
}

function privacidad(n: DatosNegocio): SeccionLegal[] {
  return [
    {
      titulo: '1. Quién es el responsable de tus datos',
      parrafos: [
        `${dato(n.responsable, 'nombre o razón social del responsable')}, con domicilio en ${dato(n.domicilio, 'domicilio')}, es el responsable del tratamiento de tus datos personales en SwiftSite Clean.`,
        `Contacto para temas de datos personales: ${contacto(n)}`,
      ],
    },
    {
      titulo: '2. Qué datos recogemos',
      parrafos: ['Solo pedimos lo necesario para prestarte el servicio:'],
      lista: [
        'Datos de tu cuenta: nombre, correo electrónico y, si quieres, teléfono.',
        'Contraseña: nunca la guardamos tal cual; se almacena cifrada (hash) y nadie del equipo puede verla.',
        'Datos de tus pedidos: servicios y cantidades elegidos, dirección donde se prestará el servicio, zona, fecha, franja horaria, montos y estado.',
        'Tus valoraciones: las estrellas, los aspectos que marcas y el comentario, si decides escribirlo.',
        'Datos técnicos de sesión: un token de acceso que se guarda en tu dispositivo mientras la sesión está abierta.',
        'Registro de tu aceptación: la versión de estos textos que aceptaste y la fecha y hora en que lo hiciste.',
      ],
    },
    {
      titulo: '3. Para qué los usamos',
      parrafos: ['Usamos tus datos únicamente para:'],
      lista: [
        'Crear y proteger tu cuenta, e identificarte cuando inicias sesión.',
        'Calcular, registrar, coordinar y prestar los servicios que pides, incluyendo contactarte por teléfono o WhatsApp sobre tu pedido.',
        'Mostrarte tu historial de pedidos.',
        'Revisar tus valoraciones y, si decidimos mostrarlas, publicarlas en el Inicio de la aplicación con tu nombre y la inicial de tu apellido (sin correo, teléfono ni dirección).',
        'Atender consultas, reclamos y garantías.',
        'Cumplir obligaciones legales y llevar la contabilidad básica del negocio.',
      ],
    },
    {
      titulo: '4. Con qué base los tratamos',
      parrafos: [
        'Tratamos tus datos con tu consentimiento, que nos das al marcar la casilla al crear tu cuenta, y porque son necesarios para ejecutar el servicio que solicitas. Puedes retirar tu consentimiento en cualquier momento eliminando tu cuenta o escribiéndonos; esto no afecta lo que ya se haya hecho antes.',
        'No usamos tus datos para publicidad de terceros ni los vendemos.',
      ],
    },
    {
      titulo: '5. Con quién los compartimos',
      parrafos: [
        'No vendemos ni cedemos tus datos. Solo los conocen las personas del equipo que necesitan tu pedido para atenderte, y los proveedores que hacen posible el sistema, como el servicio de alojamiento donde corre la aplicación, quienes solo pueden usarlos para ese fin.',
        'Las valoraciones que decidimos mostrar son públicas: las ve cualquier persona que use la aplicación. En ellas solo aparece tu nombre con la inicial de tu apellido, nunca tus datos de contacto. Puedes pedirnos que dejemos de mostrar una opinión tuya.',
        'Si nos escribes por WhatsApp, esa conversación también se rige por los términos y la política de privacidad de WhatsApp. Podríamos entregar datos a una autoridad cuando la ley lo exija.',
      ],
    },
    {
      titulo: '6. Cuánto tiempo los conservamos',
      parrafos: [
        'Mientras tengas cuenta activa. Si la eliminas, borramos tus datos personales. Si ya tenías pedidos, conservamos únicamente el registro del servicio prestado (fecha, servicios y montos) sin tu nombre, teléfono, correo ni dirección, porque lo necesitamos para la contabilidad y la garantía.',
      ],
    },
    {
      titulo: '7. Tus derechos',
      parrafos: ['Como titular de tus datos puedes ejercer en cualquier momento tus derechos de:'],
      lista: [
        'Acceso: saber qué datos tuyos tenemos y cómo los usamos.',
        'Rectificación: corregir datos inexactos o incompletos.',
        'Cancelación (supresión): pedir que borremos tus datos.',
        'Oposición: negarte a un uso concreto de tus datos.',
        'Portabilidad: recibir tus datos en un formato de uso común.',
        'Limitación del tratamiento: pedir que dejemos de usarlos temporalmente en los casos que la ley permite.',
      ],
    },
    {
      titulo: '8. Cómo ejercerlos',
      parrafos: [
        'Desde "Mi perfil" puedes corregir tu nombre y teléfono, cambiar tu contraseña y eliminar tu cuenta tú mismo. Para tu correo o para cualquiera de los demás derechos, escríbenos por los medios de contacto de este aviso indicando tu nombre y el derecho que quieres ejercer. Te responderemos dentro del plazo que fija la ley.',
        'Si consideras que tus derechos no fueron atendidos, puedes acudir a la autoridad de protección de datos personales de El Salvador.',
      ],
    },
    {
      titulo: '9. Cómo protegemos tus datos',
      parrafos: [
        'Usamos conexiones cifradas, contraseñas almacenadas con hash, acceso al panel solo para personal autorizado, límites de intentos de inicio de sesión y cierre de sesiones anteriores cuando cambias tu contraseña. Si ocurriera una brecha de seguridad que afecte tus datos, te lo comunicaremos y avisaremos a la autoridad como exige la ley.',
      ],
    },
    {
      titulo: '10. Menores de edad',
      parrafos: [
        'El servicio es para personas mayores de edad. No recogemos de forma consciente datos de menores. Si crees que un menor creó una cuenta, escríbenos y la eliminaremos.',
      ],
    },
    {
      titulo: '11. Cambios a este aviso',
      parrafos: [
        'Si modificamos este aviso de forma importante, te lo mostraremos en la aplicación y, cuando sea necesario, te pediremos aceptarlo de nuevo. La versión y fecha vigentes aparecen al inicio de esta página.',
      ],
    },
  ];
}
