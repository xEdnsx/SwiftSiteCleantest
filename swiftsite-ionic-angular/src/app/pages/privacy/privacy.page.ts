import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent,IonHeader,IonToolbar } from '@ionic/angular/standalone';
@Component({selector:'app-privacy',standalone:true,imports:[CommonModule,RouterLink,IonContent,IonHeader,IonToolbar],template:`<div class="ion-page"><ion-header class="ion-no-border"><ion-toolbar><div class="privacy-header"><a routerLink="/">← Volver al inicio</a><strong>SwiftSite Clean</strong></div></ion-toolbar></ion-header><ion-content><main class="privacy"><h1>Política de privacidad</h1><p>Actualizado: octubre de 2026</p><section *ngFor="let s of sections"><h2>{{s.titulo}}</h2><p>{{s.texto}}</p></section><a routerLink="/">Volver a Inicio</a></main></ion-content></div>`})
export class PrivacyPage {sections=[
{titulo:'Quién es responsable',texto:'SwiftSite Clean es un negocio de limpieza profunda a domicilio. Esta página informa sobre nuestros servicios y permite contactarnos por WhatsApp.'},
{titulo:'Qué datos recibimos',texto:'El registro solicita nombre, correo, contraseña y, opcionalmente, teléfono. La contraseña se almacena como hash en el servidor. También puedes consultar servicios y cotizar como invitado sin crear una cuenta.'},
{titulo:'Para qué los usamos',texto:'Para autenticar tu cuenta, mostrar tu perfil y calcular cotizaciones. Si nos escribes por WhatsApp, recibimos los datos que decidas compartir para responder consultas y coordinar visitas.'},
{titulo:'Sesión de la aplicación',texto:'La aplicación guarda un token de acceso en el almacenamiento de sesión del dispositivo o navegador. Se envía únicamente a nuestra API para identificarte. Al cerrar sesión se revoca el token utilizado.'},
{titulo:'Cookies y rastreo',texto:'La landing original declara que no utiliza publicidad de seguimiento ni analítica. Verifica nuevamente esta declaración antes de publicar nuevas integraciones.'},
{titulo:'Alojamiento',texto:'El proveedor de alojamiento puede registrar información técnica para operar el servicio de forma segura.'},
{titulo:'WhatsApp',texto:'Al abrir WhatsApp se aplican también los términos y la política de privacidad de ese servicio.'},
{titulo:'Contacto',texto:'Puedes escribir al canal de WhatsApp publicado en esta aplicación para consultar cómo se utilizan tus datos.'},
]}
