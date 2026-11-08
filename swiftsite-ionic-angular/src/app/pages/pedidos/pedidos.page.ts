import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../shared/icon.component';
import { PedidosService } from '../../core/pedidos.service';
import { httpError } from '../../core/api.interceptor';
import { EstadoPedido, LineaPedidoApi, PedidoApi, PedidoVista, aVista, esActivo, numeroPedido } from './pedidos';
import { IconName } from '../../shared/icon.component';
import { ValoracionDePedido } from '../valorar/valorar';
import { textoEnlaceReporte } from '../reportar/reportar';

/** Mis pedidos: lee los pedidos reales de la persona desde la API. */
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IconComponent],
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
})
export class PedidosPage {
  private api = inject(PedidosService);

  tabActiva: 'activos' | 'historial' = 'activos';
  readonly etapas: EstadoPedido[] = ['Cotizado', 'Confirmado', 'En proceso', 'Finalizado'];

  pedidos: PedidoVista[] = [];
  /** Pedido abierto en el detalle (null = cerrado). */
  detalle: PedidoApi | null = null;
  private crudos = new Map<string, PedidoApi>();
  cargando = false;
  error = '';

  get pedidosActivos(): PedidoVista[] { return this.pedidos.filter((p) => esActivo(p.estado)); }
  get pedidosHistorial(): PedidoVista[] { return this.pedidos.filter((p) => !esActivo(p.estado)); }

  ionViewWillEnter(): void { void this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      const hoy = new Date();
      const lista = await firstValueFrom(this.api.mios());
      this.crudos = new Map(lista.map((p) => [numeroPedido(p.id_pedido), p]));
      this.pedidos = lista.map((p) => aVista(p, hoy));
    } catch (error) {
      this.error = httpError(error);
    } finally { this.cargando = false; }
  }

  verDetalle(p: PedidoVista): void { this.detalle = this.crudos.get(p.id) ?? null; }
  cerrarDetalle(): void { this.detalle = null; }
  /** "#0041" → 41 (para la ruta de reportar). */
  idNumerico(p: PedidoVista): number { return Number(p.id.replace('#', '')); }
  /** Valoración que la persona ya envió de este pedido (null si todavía no). */
  valoracionDe(p: PedidoVista): ValoracionDePedido | null { return this.crudos.get(p.id)?.valoracion ?? null; }
  /** "Reportar problema" o "Mi reporte: En revisión" según lo que ya envió. */
  textoReporte(p: PedidoVista): string { return textoEnlaceReporte(this.crudos.get(p.id)?.reportes); }
  vistaDe(p: PedidoApi): PedidoVista { return aVista(p); }
  numero(valor: string): string { return Number(valor).toFixed(2); }
  nombreLinea(l: LineaPedidoApi): string { return `${l.tipo_item ?? 'Servicio'}${l.material ? ' (' + l.material.toLowerCase() + ')' : ''}`; }
  icono(estado: EstadoPedido): IconName {
    return ({ Cotizado: 'quote', Confirmado: 'calendar', 'En proceso': 'clock', Finalizado: 'check' } as Record<EstadoPedido, IconName>)[estado];
  }

  cambiarTab(tab: 'activos' | 'historial'): void { this.tabActiva = tab; }

  badge(estado: EstadoPedido): string {
    return { Cotizado: 'cotizado', Confirmado: 'confirmado', 'En proceso': 'proceso', Finalizado: 'finalizado' }[estado];
  }
}
