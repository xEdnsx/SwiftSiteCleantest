import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Categoría (servicio). Los campos de presentación son opcionales: los llena el administrador en el panel. */
export interface Categoria {
  id_categoria: number; nombre: string; activo: boolean;
  descripcion?: string | null;
  icono?: string | null;
  pregunta_tipo?: string | null;
  pregunta_variante?: string | null;
  pregunta_cantidad?: string | null;
  unidad?: string | null;
  nota?: string | null;
  cantidad_max?: number | null;
}
export interface Tarifa {
  id_tarifa: number; id_categoria: number; tipo_item: string; material: string | null; precio_unitario: string; activo: boolean;
  /** Texto corto bajo la opción ("90 × 190 cm"). */
  detalle?: string | null;
  /** Qué incluye este servicio. */
  descripcion?: string | null;
}
export interface Zona { id_zona: number; nombre: string; recargo: string; activo: boolean; }
export interface ItemCotizacion { id_tarifa: number; cantidad: number; }
export interface Cotizacion { preliminar: boolean; subtotal: string; recargo_zona: string; total: string; }

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private http = inject(HttpClient);
  categorias() { return this.http.get<Categoria[]>(`${environment.apiUrl}/categorias?activo=1`); }
  tarifas() { return this.http.get<Tarifa[]>(`${environment.apiUrl}/tarifas?activo=1`); }
  zonas() { return this.http.get<Zona[]>(`${environment.apiUrl}/zonas?activo=1`); }
  cotizar(id_zona: number, id_tarifa: number, cantidad: number) {
    return this.cotizarItems(id_zona, [{ id_tarifa, cantidad }]);
  }
  /** Cotiza varios servicios a la vez; el servidor calcula todos los importes. */
  cotizarItems(id_zona: number, items: ItemCotizacion[]) {
    return this.http.post<Cotizacion>(`${environment.apiUrl}/cotizaciones/preliminar`, { id_zona, items });
  }
}
