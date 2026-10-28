import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonRange } from '@ionic/angular/standalone';
import type { RangeCustomEvent } from '@ionic/core';
import { servicios, comparaciones, info, foto, whatsappUrl } from '../../data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonHeader, IonToolbar, IonRange],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  @ViewChild(IonContent) content?: IonContent;
  servicios = servicios;
  comparaciones = comparaciones;
  info = info;
  foto = foto;
  whatsappUrl = whatsappUrl;
  actual = 0;
  porcentaje = 50;
  readonly whatsappDisponible = whatsappUrl() !== null;

  seleccionar(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.comparaciones.length) return;
    this.actual = index;
    this.porcentaje = 50;
  }

  get par() { return this.comparaciones[this.actual]!; }
  get clip(): string { return `inset(0 ${100 - this.porcentaje}% 0 0)`; }

  onRange(event: RangeCustomEvent): void {
    const value = event.detail.value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      this.porcentaje = Math.min(100, Math.max(0, value));
    }
  }

  async scrollToSection(event: Event, id: string): Promise<void> {
    event.preventDefault();
    if (!this.content) return;
    const scroll = await this.content.getScrollElement();
    const target = this.element.nativeElement.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    const top = target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;
    await this.content.scrollToPoint(0, top, duration);
  }
}
