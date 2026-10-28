import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-shell', standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel],
  template: `<ion-tabs><ion-tab-bar slot="bottom">
    <ion-tab-button tab="inicio" href="/inicio"><ion-label>Inicio</ion-label></ion-tab-button>
    <ion-tab-button tab="cotizar" href="/cotizar"><ion-label>Cotizar</ion-label></ion-tab-button>
    <ion-tab-button tab="pedidos" href="/pedidos"><ion-label>Pedidos</ion-label></ion-tab-button>
    <ion-tab-button tab="perfil" href="/perfil"><ion-label>Perfil</ion-label></ion-tab-button>
  </ion-tab-bar></ion-tabs>`,
})
export class ShellPage {}
