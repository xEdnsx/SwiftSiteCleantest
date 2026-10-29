import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { IconComponent } from '../../shared/icon.component';

/**
 * Valorar un servicio (vista visual con datos de ejemplo).
 * TODO: recibir el pedido por ruta (/valorar/:id) y enviar la valoración a la API.
 */
@Component({
  selector: 'app-valorar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './valorar.page.html',
  styleUrls: ['./valorar.page.scss'],
})
export class ValorarPage {
  constructor(private router: Router) {}

  readonly pedido = { id: '#0041', servicio: 'Baño completo', detalle: 'Hoy · Nuevo Cuscatlán' };
  readonly etiquetasEstrellas = ['', 'Mal', 'Regular', 'Bien', 'Muy bien', 'Excelente'];
  readonly aspectos = ['Puntualidad', 'Limpieza', 'Buen trato', 'Precio justo'];

  estrellas = 4;
  elegidos = new Set<string>(['Puntualidad', 'Limpieza']);
  comentario = '';

  alternar(aspecto: string): void {
    if (this.elegidos.has(aspecto)) this.elegidos.delete(aspecto);
    else this.elegidos.add(aspecto);
  }

  enviar(): void {
    // TODO: POST a la API de valoraciones. Por ahora solo vuelve a Mis pedidos.
    void this.router.navigateByUrl('/pedidos');
  }
}
