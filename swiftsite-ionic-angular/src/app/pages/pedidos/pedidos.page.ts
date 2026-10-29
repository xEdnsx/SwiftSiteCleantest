import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { IconComponent } from '../../shared/icon.component';

type Estado = 'Cotizado' | 'Confirmado' | 'En proceso' | 'Finalizado';

interface Pedido {
  id: string;
  estado: Estado;
  titulo: string;
  fecha: string;
  zona: string;
  total: number;
  /** 1 = Cotizado, 2 = Confirmado, 3 = En proceso, 4 = Finalizado */
  progreso: number;
  valorado?: boolean;
}

/**
 * Mis pedidos (vista visual con datos de ejemplo).
 * TODO: reemplazar los arrays por la respuesta de la API de pedidos cuando exista.
 */
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IconComponent],
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
})
export class PedidosPage {
  tabActiva: 'activos' | 'historial' = 'activos';
  readonly etapas: Estado[] = ['Cotizado', 'Confirmado', 'En proceso', 'Finalizado'];

  pedidosActivos: Pedido[] = [
    { id: '#0042', estado: 'En proceso', titulo: 'Sofá 3 puestos ×2 y butaca', fecha: 'Hoy · 10:00 a. m.', zona: 'Santa Tecla', total: 120, progreso: 3 },
    { id: '#0045', estado: 'Confirmado', titulo: 'Colchón matrimonial ×1', fecha: 'Sáb 24 oct · 8:00 a. m.', zona: 'Antiguo Cuscatlán', total: 35, progreso: 2 },
  ];

  pedidosHistorial: Pedido[] = [
    { id: '#0041', estado: 'Finalizado', titulo: 'Baño completo', fecha: 'Hoy · 7:30 a. m.', zona: 'Nuevo Cuscatlán', total: 40, progreso: 4, valorado: false },
    { id: '#0039', estado: 'Finalizado', titulo: 'Sofá 3 puestos ×1', fecha: 'Mié 14 oct · 2:00 p. m.', zona: 'Santa Tecla', total: 45, progreso: 4, valorado: true },
    { id: '#0035', estado: 'Finalizado', titulo: 'Colchón individual ×1', fecha: 'Sáb 3 oct · 8:00 a. m.', zona: 'San Salvador', total: 25, progreso: 4, valorado: true },
  ];

  cambiarTab(tab: 'activos' | 'historial'): void { this.tabActiva = tab; }

  badge(estado: Estado): string {
    return { Cotizado: 'cotizado', Confirmado: 'confirmado', 'En proceso': 'proceso', Finalizado: 'finalizado' }[estado];
  }
}
