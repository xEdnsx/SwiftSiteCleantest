import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-cotizar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonToolbar],
  templateUrl: './cotizar.page.html',
  styleUrls: ['./cotizar.page.scss'],
})
export class CotizarPage {
  paso = 1;
  
  // Datos
  categorias = [
    { id: 'sillas', nombre: 'Sillas', icono: '🪑', desc: 'Empresariales, de comedor y más.' },
    { id: 'muebles', nombre: 'Muebles', icono: '🛋️', desc: 'Juegos de sala, ottomans y butacas.' },
    { id: 'colchones', nombre: 'Colchones', icono: '🛏️', desc: 'De individual a king, por ambos lados.' },
    { id: 'banos', nombre: 'Baños', icono: '🛁', desc: 'Desinfección y desincrustado de pisos.' }
  ];

  tipoMueble = 'Sofá 3 puestos';
  material = 'Tela';
  cantidad = 2;
  
  zona = 'Santa Tecla';
  fecha = 'Mié 21';
  hora = '10:00';

  // Cálculos
  get subtotal() { return this.cantidad * 45.00; }
  get total() { return this.subtotal; }

  // Navegación
  siguientePaso() {
    if (this.paso < 4) this.paso++;
  }

  pasoAnterior() {
    if (this.paso > 1) this.paso--;
  }
}