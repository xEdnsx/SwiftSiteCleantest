# SwiftSite Clean — Ionic Angular (sin Vue)

Este proyecto es una **migración de la landing pública** proporcionada en el ZIP `swiftsite-admin-vue`. Está implementado con Ionic Framework 8 + Angular 19 y contiene **cero componentes `.vue`** o dependencias Vue.

## Contenido migrado
- Página de Inicio, presentación y servicios de limpieza.
- Slider funcional Antes/Después (Ionic `ion-range`).
- Servicios: sillas, muebles, colchones, baños.
- Cómo funciona, cobertura, horario y garantía.
- Botones para cotizar por WhatsApp.
- Página de privacidad y navegación.
- Fotografías y logos originales.

## Instalación
Requisitos: Node.js 20 o superior; npm. En la carpeta del proyecto:

```bash
npm install
npm run dev
```
Abrir `http://localhost:4200`. Para generar producción:

```bash
npm run build
```

## Android (opcional)
Tras `npm install` y `npm run build`:

```bash
npx cap add android
npx cap sync android
npx cap open android
```

Requiere Android Studio. Ajustar `appId` en `capacitor.config.ts`.

## Configuración pendiente
- En `src/app/data.ts`, reemplazar `WA_NUMBER = '503XXXXXXXX'` con el número real de WhatsApp (formato internacional, solo números).
- Revisar la política de privacidad y comprobar su exactitud antes de publicar.
- No incluye panel administrativo: Vue es el Back Office. Sprint 2 agrega autenticación de clientes, navegación y una cotización preliminar conectada a Laravel; no incluye confirmación ni seguimiento de pedidos.
- No se conservó Vue ni Vue Router. Se reescribió la interfaz en Angular con Ionic y se preservaron los assets originales.

## Verificación
Verificación Sprint 2: compilación de producción, TypeScript, pruebas de datos y flujos de navegador ejecutados. Consulta `SPRINT2.md` y el informe `Api-Rest/SPRINT2_AVANCES.md` para los resultados y sus límites.


## Corrección Ionic Angular (25 octubre 2026)
Se eliminó IonPage (no existe como export en @ionic/angular/standalone). Las páginas usan `<div class="ion-page">` con IonHeader e IonContent. Ejecute `npm install` y `npm run dev`.

## Reparaciones verificadas
- Se quitaron imports Ionic sin uso.
- La navegacion por secciones usa el scroll de IonContent sin alterar las rutas hash.
- El comparador valida y limita el valor del rango entre 0 y 100.
- ionic:build invoca Angular directamente y no vuelve a llamar Ionic CLI.
- Los botones de WhatsApp se desactivan si el numero sigue siendo de ejemplo; configurar WA_NUMBER en src/app/data.ts.
- Se habilito el zoom y se agrego el favicon existente.
- Ejecutar npm test, npm run type-check y npm run ionic:build para verificar.
- Android necesita Android Studio y su SDK; el build web no certifica la compilacion nativa.
