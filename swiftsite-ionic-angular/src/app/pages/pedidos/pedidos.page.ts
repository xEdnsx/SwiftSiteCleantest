import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonHeader, IonToolbar],
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
})
export class PedidosPage {
  tabActiva: 'activos' | 'historial' = 'activos';

  pedidosActivos = [
    {
      id: '#0042',
      estado: 'En proceso',
      titulo: 'Sofá 3 puestos *2 y butaca',
      fecha: 'Hoy · 10:00 a. m.',
      zona: 'Santa Tecla',
      total: 120.00,
      progreso: 3 // 1=Cotizado, 2=Confirmado, 3=En proceso, 4=Finalizado
    },
    {
      id: '#0045',
      estado: 'Confirmado',
      titulo: 'Colchón matrimonial *1',
      fecha: 'Sáb 24 oct · 8:00 a. m.',
      zona: 'Antiguo Cuscatlán',
      total: 35.00,
      progreso: 2
    }
  ];

  pedidosHistorial = [
    {
      id: '#0038',
      estado: 'Finalizado',
      titulo: 'Sillas de comedor *4',
      fecha: 'Mié 14 oct · 2:00 p. m.',
      zona: 'Santa Tecla',
      total: 30.00,
      valorado: false
    },
    {
      id: '#0035',
      estado: 'Finalizado',
      titulo: 'Colchón individual *1',
      fecha: 'Sáb 3 oct · 8:00 a. m.',
      zona: 'San Salvador',
      total: 25.00,
      valorado: true
    }
  ];

  cambiarTab(tab: 'activos' | 'historial') {
    this.tabActiva = tab;
  }
}