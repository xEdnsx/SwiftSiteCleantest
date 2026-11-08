import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin } from 'rxjs';
import { CatalogosService } from '../../core/catalogos.service';
import { ValoracionesService } from '../../core/valoraciones.service';
import { httpError } from '../../core/api.interceptor';
import { IconComponent } from '../../shared/icon.component';
import { comparaciones, info, foto, whatsappUrl } from '../../data';
import { CONTACTO, NEGOCIO } from '../legal/legal';
import { iconoValido } from '../quote/calculadora';
import { OpinionPublica, etiquetaAspecto, gustoConEstrellas, mesYAnio, opinionesParaMostrar } from './opiniones';
import type { IconName } from '../../shared/icon.component';

/** Tarjeta de un servicio en el Inicio: todo sale de la base de datos. */
interface ServicioInicio { id: number; nombre: string; nota: string; icono: IconName; desde: string | null; }

/** Precio más bajo de un servicio (sin contar extras), como texto: "$10.00". null si no hay. */
function precioDesde(tarifas: { tipo_item: string; precio_unitario: string }[]): string | null {
  const precios = tarifas
    .filter((t) => !t.tipo_item.trim().toLowerCase().startsWith('extra:'))
    .map((t) => Number(t.precio_unitario))
    .filter((n) => Number.isFinite(n));
  return precios.length ? `$${Math.min(...precios).toFixed(2)}` : null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IconComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly api = inject(CatalogosService);
  private readonly valoraciones = inject(ValoracionesService);

  /** Opiniones que el equipo decidió mostrar. Si no hay (o no cargan), la sección no aparece. */
  opiniones: OpinionPublica[] = [];
  readonly mesYAnio = mesYAnio;
  readonly gustoConEstrellas = gustoConEstrellas;
  readonly etiquetaAspecto = etiquetaAspecto;
  readonly estrellas = [1, 2, 3, 4, 5];

  servicios: ServicioInicio[] = [];
  cargandoServicios = true;
  errorServicios = '';
  comparaciones = comparaciones;
  readonly negocio = NEGOCIO;
  readonly contacto = CONTACTO;
  readonly iconosInfo: IconName[] = ['pin', 'clock', 'shield', 'spark'];
  readonly info = info.map((i, n) => ({ ...i, icono: this.iconosInfo[n] ?? 'spark' }));
  foto = foto;
  whatsappUrl = whatsappUrl;
  
  actual = 0;
  porcentaje = 50;
  isDragging = false;
  readonly whatsappDisponible = whatsappUrl() !== null;
  readonly pasos = [
    { icono: 'quote' as IconName, titulo: 'Cotiza', texto: 'Elige tus servicios y mira el precio al instante.' },
    { icono: 'calendar' as IconName, titulo: 'Agenda', texto: 'Escoge día, hora y dónde te atendemos.' },
    { icono: 'spark' as IconName, titulo: 'Disfruta', texto: 'Vamos a tu hogar con el equipo adecuado.' },
  ];

  ngOnInit(): void {
    void this.cargarServicios();
    void this.cargarOpiniones();
  }

  /** Las opiniones son un extra: si fallan, el Inicio sigue igual y simplemente no se muestran. */
  async cargarOpiniones(): Promise<void> {
    try {
      this.opiniones = opinionesParaMostrar(await firstValueFrom(this.valoraciones.publicas()));
    } catch {
      this.opiniones = [];
    }
  }

  /** Muestra los servicios activos que tienen al menos una tarifa activa (los mismos que ve la calculadora). */
  async cargarServicios(): Promise<void> {
    this.cargandoServicios = true;
    this.errorServicios = '';
    try {
      const { categorias, tarifas } = await firstValueFrom(forkJoin({ categorias: this.api.categorias(), tarifas: this.api.tarifas() }));
      const conTarifas = new Set(tarifas.map((t) => t.id_categoria));
      this.servicios = categorias.filter((c) => conTarifas.has(c.id_categoria)).map((c) => ({
        id: c.id_categoria,
        nombre: c.nombre,
        nota: (c.descripcion ?? '').trim(),
        icono: iconoValido(c.icono),
        desde: precioDesde(tarifas.filter((t) => t.id_categoria === c.id_categoria)),
      }));
    } catch (error) {
      this.errorServicios = httpError(error);
    } finally {
      this.cargandoServicios = false;
    }
  }

  seleccionar(index: number): void {
    if (index < 0 || index >= this.comparaciones.length) return;
    this.actual = index;
    this.porcentaje = 50;
  }

  get par() { return this.comparaciones[this.actual]!; }
  get clip(): string { return `inset(0 ${100 - this.porcentaje}% 0 0)`; }

  // Lógica del Slider
  startDrag(event: PointerEvent) {
    this.isDragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.updateDrag(event);
  }

  onDrag(event: PointerEvent) {
    if (!this.isDragging) return;
    this.updateDrag(event);
  }

  stopDrag() {
    this.isDragging = false;
  }

  private updateDrag(event: PointerEvent) {
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    let x = event.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width)); // Limitar bordes
    this.porcentaje = (x / rect.width) * 100;
  }

  /** Accesibilidad: el comparador también se mueve con las flechas del teclado. */
  onTecla(event: KeyboardEvent): void {
    const paso = event.shiftKey ? 20 : 5;
    if (event.key === 'ArrowLeft') this.porcentaje = Math.max(0, this.porcentaje - paso);
    else if (event.key === 'ArrowRight') this.porcentaje = Math.min(100, this.porcentaje + paso);
    else return;
    event.preventDefault();
  }
}
