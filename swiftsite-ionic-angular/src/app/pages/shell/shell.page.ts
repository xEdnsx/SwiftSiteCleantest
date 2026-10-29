import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel } from '@ionic/angular/standalone';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-shell', standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel, IconComponent],
  template: `<ion-tabs><ion-tab-bar slot="bottom">
    <ion-tab-button tab="inicio" href="/inicio"><ssc-icon name="home" /><ion-label>Inicio</ion-label></ion-tab-button>
    <ion-tab-button tab="cotizar" href="/cotizar"><ssc-icon name="quote" /><ion-label>Cotizar</ion-label></ion-tab-button>
    <ion-tab-button tab="pedidos" href="/pedidos"><ssc-icon name="orders" /><ion-label>Pedidos</ion-label></ion-tab-button>
    <ion-tab-button tab="perfil" href="/perfil"><ssc-icon name="profile" /><ion-label>Perfil</ion-label></ion-tab-button>
  </ion-tab-bar></ion-tabs>`,
  styleUrls: ['./shell.page.scss'],
})
export class ShellPage {}
