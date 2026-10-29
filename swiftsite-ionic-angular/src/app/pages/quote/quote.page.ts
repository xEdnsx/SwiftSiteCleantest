import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin } from 'rxjs';
import { CatalogosService, Categoria, Tarifa, Zona, Cotizacion } from '../../core/catalogos.service';
import { httpError } from '../../core/api.interceptor';

@Component({
  selector: 'app-quote', standalone: true, imports: [CommonModule, FormsModule, RouterLink, IonContent],
  styleUrls: ['./quote.page.scss'],
  template: `<ion-content><main class="screen">
    <h1>Cotización preliminar</h1>
    <p class="lead">Disponible también para invitados. No crea ni confirma un pedido.</p>
    <p *ngIf="loading" role="status" class="status">Cargando catálogos...</p>
    <p *ngIf="error" role="alert" class="error">{{ error }}</p>
    <button *ngIf="!loading && !ready" class="btn-retry" (click)="load()">Reintentar</button>
    <form *ngIf="ready" #form="ngForm" (ngSubmit)="cotizar()">
      <label for="q-tarifa">Servicio</label>
      <select id="q-tarifa" name="tarifa" [(ngModel)]="idTarifa" (ngModelChange)="resultado = null" required><option [ngValue]="null">Selecciona un servicio</option><option *ngFor="let t of tarifas" [ngValue]="t.id_tarifa">{{ t.tipo_item }} {{ t.material || '' }} — {{ t.precio_unitario }}</option></select>
      <label for="q-zona">Zona</label>
      <select id="q-zona" name="zona" [(ngModel)]="idZona" (ngModelChange)="resultado = null" required><option [ngValue]="null">Selecciona una zona</option><option *ngFor="let z of zonas" [ngValue]="z.id_zona">{{ z.nombre }}</option></select>
      <label for="q-cantidad">Cantidad</label>
      <input id="q-cantidad" type="number" name="cantidad" [(ngModel)]="cantidad" (ngModelChange)="resultado = null" min="1" max="10000" step="1" required>
      <button class="btn-primary" [disabled]="busy || form.invalid">{{ busy ? 'Calculando...' : 'Calcular' }}</button>
    </form>
    <section *ngIf="resultado" class="result" aria-live="polite">
      <h2>Estimación del servidor</h2>
      <div class="row"><span>Subtotal</span><span>{{ resultado.subtotal }}</span></div>
      <div class="row"><span>Recargo</span><span>{{ resultado.recargo_zona }}</span></div>
      <div class="total"><span>Total</span><strong>{{ resultado.total }}</strong></div>
    </section>
    <a routerLink="/cotizar/pasos" class="wizard-link">Probar cotización paso a paso</a>
    </main></ion-content>`,
})
export class QuotePage {
  private api = inject(CatalogosService);
  tarifas: Tarifa[] = [];
  zonas: Zona[] = [];
  idTarifa: number | null = null;
  idZona: number | null = null;
  cantidad = 1;
  resultado: Cotizacion | null = null;
  loading = false;
  ready = false;
  busy = false;
  error = '';
  ionViewWillEnter(): void { void this.load(); }
  async load(): Promise<void> {
    this.loading = true;
    this.ready = false;
    this.error = '';
    this.resultado = null;
    try {
      const data = await firstValueFrom(forkJoin({ categorias: this.api.categorias(), tarifas: this.api.tarifas(), zonas: this.api.zonas() }));
      const active = new Set(data.categorias.map((c: Categoria) => c.id_categoria));
      this.tarifas = data.tarifas.filter(t => active.has(t.id_categoria));
      this.zonas = data.zonas;
      this.ready = true;
    } catch (error) { this.error = httpError(error); }
    finally { this.loading = false; }
  }
  async cotizar(): Promise<void> {
    if (this.idZona === null || this.idTarifa === null || this.busy) return;
    this.busy = true;
    this.resultado = null;
    this.error = '';
    try { this.resultado = await firstValueFrom(this.api.cotizar(this.idZona, this.idTarifa, this.cantidad)); }
    catch (error) { this.error = httpError(error); }
    finally { this.busy = false; }
  }
}
