import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../shared/icon.component';
import { PedidosService } from '../../core/pedidos.service';
import { ValoracionesService } from '../../core/valoraciones.service';
import { httpError } from '../../core/api.interceptor';
import { PedidoApi, PedidoVista, aVista } from '../pedidos/pedidos';
import { ASPECTOS, COMENTARIO_MAX, ETIQUETAS_ESTRELLAS, ValoracionApi, armarValoracion, estadoFormulario, etiquetaAspecto, gustoConEstrellas, limpiarComentario, textosAspectos } from './valorar';

/** Valorar un pedido finalizado (/valorar/:id). Al enviar, la misma pantalla muestra la confirmación. */
@Component({
  selector: 'app-valorar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './valorar.page.html',
  styleUrls: ['./valorar.page.scss'],
})
export class ValorarPage {
  private route = inject(ActivatedRoute);
  private pedidos = inject(PedidosService);
  private valoraciones = inject(ValoracionesService);

  readonly etiquetasEstrellas = ETIQUETAS_ESTRELLAS;
  readonly aspectos = ASPECTOS;
  readonly max = COMENTARIO_MAX;
  readonly textosAspectos = textosAspectos;
  readonly etiquetaAspecto = etiquetaAspecto;

  /** Lo que eligió, escrito como corresponde a sus estrellas (para la pantalla de gracias). */
  aspectosEscritos(v: ValoracionApi): string { return v.aspectos.map((a) => etiquetaAspecto(a, v.estrellas)).join(', '); }

  pedido: PedidoApi | null = null;
  vista: PedidoVista | null = null;
  cargando = true;
  errorCarga = '';

  estrellas = 0;
  elegidos = new Set<string>();
  comentario = '';
  enviando = false;
  errorEnvio = '';
  /** Valoración ya enviada (muestra la pantalla de confirmación). */
  enviada: ValoracionApi | null = null;

  get formulario() { return estadoFormulario(this.estrellas, this.comentario); }
  get textos() { return textosAspectos(this.estrellas); }
  get largo(): number { return limpiarComentario(this.comentario).length; }

  ionViewWillEnter(): void { void this.cargar(); }

  async cargar(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargando = true;
    this.errorCarga = '';
    this.errorEnvio = '';
    this.enviada = null;
    this.estrellas = 0;
    this.elegidos = new Set<string>();
    this.comentario = '';
    if (!Number.isInteger(id) || id <= 0) { this.errorCarga = 'No encontramos ese pedido.'; this.cargando = false; return; }
    try {
      this.pedido = await firstValueFrom(this.pedidos.uno(id));
      this.vista = aVista(this.pedido);
      if (this.pedido.estado !== 'Finalizado') this.errorCarga = 'Solo puedes valorar un pedido cuando ya está finalizado.';
    } catch (error) {
      this.pedido = null;
      this.vista = null;
      this.errorCarga = httpError(error);
    } finally { this.cargando = false; }
  }

  elegirEstrellas(n: number): void {
    // Si pasa de "lo que gustó" a "lo que hay que mejorar" (o al revés), lo ya marcado deja de tener sentido.
    if (this.estrellas && gustoConEstrellas(this.estrellas) !== gustoConEstrellas(n)) this.elegidos = new Set<string>();
    this.estrellas = n;
    this.errorEnvio = '';
  }

  alternar(aspecto: string): void {
    if (this.elegidos.has(aspecto)) this.elegidos.delete(aspecto);
    else this.elegidos.add(aspecto);
  }

  async enviar(): Promise<void> {
    if (!this.pedido || !this.formulario.valido || this.enviando) return;
    this.enviando = true;
    this.errorEnvio = '';
    try {
      this.enviada = await firstValueFrom(this.valoraciones.enviar(armarValoracion(this.pedido.id_pedido, this.estrellas, this.elegidos, this.comentario)));
    } catch (error) {
      this.errorEnvio = httpError(error);
    } finally { this.enviando = false; }
  }
}
