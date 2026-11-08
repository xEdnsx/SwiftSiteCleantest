import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { IconComponent } from '../../shared/icon.component';
import { LEGAL_FECHA, LEGAL_VERSION, TipoLegal, secciones, titulo } from './legal';

/** Una sola pantalla para /terminos y /privacidad (el tipo viene en la ruta). */
@Component({
  selector: 'app-legal', standalone: true,
  imports: [CommonModule, IonContent, IconComponent],
  styleUrls: ['./legal.page.scss'],
  template: `<ion-content>
    <main class="screen">
      <header class="barra">
        <button type="button" class="volver" aria-label="Volver" (click)="volver()"><ssc-icon name="back" /></button>
        <span class="marca">SwiftSite Clean</span>
      </header>

      <h1>{{ nombre }}</h1>
      <p class="version">Versión {{ version }} · Vigente desde el {{ fecha }}</p>

      <nav class="cruce" aria-label="Documentos legales">
        <button type="button" [class.active]="tipo === 'terminos'" [attr.aria-pressed]="tipo === 'terminos'" (click)="mostrar('terminos')">Términos de uso</button>
        <button type="button" [class.active]="tipo === 'privacidad'" [attr.aria-pressed]="tipo === 'privacidad'" (click)="mostrar('privacidad')">Privacidad</button>
      </nav>

      <section *ngFor="let s of contenido" class="seccion">
        <h2>{{ s.titulo }}</h2>
        <p *ngFor="let p of s.parrafos" [class.pendiente]="p.includes('[Completar')">{{ p }}</p>
        <ul *ngIf="s.lista"><li *ngFor="let item of s.lista">{{ item }}</li></ul>
      </section>
    </main>
  </ion-content>`,
})
export class LegalPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  @ViewChild(IonContent) private contenedor?: IonContent;
  tipo: TipoLegal = this.route.snapshot.data['tipo'] === 'terminos' ? 'terminos' : 'privacidad';
  nombre = titulo(this.tipo);
  contenido = secciones(this.tipo);
  readonly version = LEGAL_VERSION;
  readonly fecha = LEGAL_FECHA;

  /**
   * Cambia entre Términos y Privacidad en ESTA misma pantalla: solo se actualiza el texto.
   * La dirección se reemplaza (no se agrega al historial), así "volver" siempre regresa a donde estabas.
   */
  mostrar(tipo: TipoLegal): void {
    if (tipo === this.tipo) return;
    this.tipo = tipo;
    this.nombre = titulo(tipo);
    this.contenido = secciones(tipo);
    this.location.replaceState(tipo === 'terminos' ? '/terminos' : '/privacidad');
    void this.contenedor?.scrollToTop(200);
  }

  /** Vuelve a donde estabas (registro, perfil…); si abriste el enlace directo, va al inicio. */
  volver(): void {
    if (window.history.length > 1) this.location.back();
    else void this.router.navigateByUrl('/inicio');
  }
}
