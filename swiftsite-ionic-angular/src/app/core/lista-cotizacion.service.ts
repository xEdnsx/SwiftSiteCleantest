import { Injectable, signal } from '@angular/core';
import type { Tarifa } from './catalogos.service';
import { LineaLista, reconciliar } from '../pages/quote/calculadora';

const CLAVE = 'swiftsite.cotizacion.lista';
const CLAVE_ZONA = 'swiftsite.cotizacion.zona';

/**
 * Lista de servicios que la persona va armando en la calculadora.
 * Se guarda en sessionStorage para no perderla al ir a iniciar sesión.
 */
@Injectable({ providedIn: 'root' })
export class ListaCotizacionService {
  readonly lineas = signal<LineaLista[]>(this.leer());
  /** Zona elegida (se usa también al pedir, para mostrar dónde será el servicio). */
  readonly idZona = signal<number | null>(this.leerZona());

  agregar(linea: LineaLista): void { this.fijar([...this.lineas(), linea]); }
  quitar(indice: number): void { this.fijar(this.lineas().filter((_, i) => i !== indice)); }
  vaciar(): void { this.fijar([]); }
  fijarZona(id: number | null): void {
    this.idZona.set(id);
    try { if (id === null) sessionStorage.removeItem(CLAVE_ZONA); else sessionStorage.setItem(CLAVE_ZONA, String(id)); } catch { /* solo en memoria */ }
  }
  /** Actualiza precios y descarta tarifas que ya no existen. */
  actualizar(tarifas: Tarifa[]): void { this.fijar(reconciliar(this.lineas(), tarifas)); }

  private fijar(lineas: LineaLista[]): void {
    this.lineas.set(lineas);
    try { sessionStorage.setItem(CLAVE, JSON.stringify(lineas)); } catch { /* sin almacenamiento: la lista vive solo en memoria */ }
  }

  private leerZona(): number | null {
    try { const n = Number(sessionStorage.getItem(CLAVE_ZONA)); return Number.isInteger(n) && n > 0 ? n : null; } catch { return null; }
  }

  private leer(): LineaLista[] {
    try {
      const datos: unknown = JSON.parse(sessionStorage.getItem(CLAVE) ?? '[]');
      return Array.isArray(datos) ? (datos as LineaLista[]).filter((l) => l?.tarifa && Array.isArray(l.extras) && l.cantidad > 0) : [];
    } catch { return []; }
  }
}
