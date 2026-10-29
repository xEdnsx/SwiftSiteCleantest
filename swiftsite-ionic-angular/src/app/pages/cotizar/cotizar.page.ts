import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { IconComponent, IconName } from '../../shared/icon.component';
import { whatsappUrl } from '../../data';

interface Categoria { id: IconName; nombre: string; desc: string; }
interface Linea { tipo: string; material: string; cantidad: number; }
interface Dia { etiqueta: string; numero: number; fecha: Date; }

/**
 * Asistente de cotización en 4 pasos (vista visual con datos de ejemplo).
 * Aún no usa la API: los precios y zonas son de muestra. Para la cotización real
 * conectada al servidor ver QuotePage (/cotizar).
 */
@Component({
  selector: 'app-cotizar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './cotizar.page.html',
  styleUrls: ['./cotizar.page.scss'],
})
export class CotizarPage {
  readonly totalPasos = 4;
  paso = 1;

  // ----- Paso 1 -----
  readonly categorias: Categoria[] = [
    { id: 'sillas', nombre: 'Sillas', desc: 'Empresariales, de comedor y más.' },
    { id: 'muebles', nombre: 'Muebles', desc: 'Juegos de sala, ottomans, butacas y tapicería de vehículos.' },
    { id: 'colchones', nombre: 'Colchones', desc: 'De individual a king, por ambos lados.' },
    { id: 'banos', nombre: 'Baños', desc: 'Desinfección y desincrustado de pisos, paredes y duchas.' },
  ];
  categoria: Categoria['id'] = 'muebles';

  // ----- Paso 2 -----
  readonly precios: Record<string, number> = {
    'Sofá 2 puestos': 35, 'Sofá 3 puestos': 45, 'Butaca': 30, 'Ottoman': 15, 'Tapicería de vehículo': 65,
  };
  readonly tipos = Object.keys(this.precios);
  readonly materiales = [
    { nombre: 'Tela', muestra: 'tela' },
    { nombre: 'Cuero', muestra: 'cuero' },
    { nombre: 'Microfibra', muestra: 'microfibra' },
  ];
  tipoMueble = 'Sofá 3 puestos';
  material = 'Tela';
  cantidad = 2;
  /** Muebles ya agregados con "Agregar otro". */
  lineas: Linea[] = [];

  // ----- Paso 3 -----
  readonly zonas = [
    { nombre: 'San Salvador Centro', recargo: 0 },
    { nombre: 'Santa Tecla', recargo: 0 },
    { nombre: 'Antiguo Cuscatlán', recargo: 0 },
    { nombre: 'Nuevo Cuscatlán', recargo: 0 },
    { nombre: 'Soyapango', recargo: 5 },
    { nombre: 'La Libertad (otras zonas)', recargo: 8 },
  ];
  zona = 'Santa Tecla';
  direccion = '';
  readonly dias: Dia[] = this.proximosDias(5);
  dia: Dia = this.dias[2]!;
  readonly horas = ['7:30', '10:00', '12:30', '2:00'];
  hora = '10:00';

  readonly whatsapp = whatsappUrl('una cotización');

  // ----- Cálculos -----
  get lineaActual(): Linea { return { tipo: this.tipoMueble, material: this.material, cantidad: this.cantidad }; }
  get lineasResumen(): Linea[] { return [...this.lineas, this.lineaActual]; }
  importe(l: Linea): number { return (this.precios[l.tipo] ?? 0) * l.cantidad; }
  get subtotalActual(): number { return this.importe(this.lineaActual); }
  get subtotal(): number { return this.lineasResumen.reduce((a, l) => a + this.importe(l), 0); }
  get recargo(): number { return this.zonas.find((z) => z.nombre === this.zona)?.recargo ?? 0; }
  get total(): number { return this.subtotal + this.recargo; }
  get fechaLarga(): string {
    return this.dia.fecha.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // ----- Acciones -----
  cambiarCantidad(delta: number): void { this.cantidad = Math.max(1, this.cantidad + delta); }
  agregarOtro(): void {
    this.lineas.push({ ...this.lineaActual });
    this.cantidad = 1;
  }
  siguiente(): void { if (this.paso < this.totalPasos) this.paso++; }
  anterior(): void { if (this.paso > 1) this.paso--; }

  private proximosDias(n: number): Dia[] {
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return Array.from({ length: n }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i + 1);
      return { etiqueta: nombres[fecha.getDay()]!, numero: fecha.getDate(), fecha };
    });
  }
}
