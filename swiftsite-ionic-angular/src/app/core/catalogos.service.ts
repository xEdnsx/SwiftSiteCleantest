import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Categoria { id_categoria: number; nombre: string; activo: boolean; }
export interface Tarifa { id_tarifa: number; id_categoria: number; tipo_item: string; material: string | null; precio_unitario: string; activo: boolean; }
export interface Zona { id_zona: number; nombre: string; recargo: string; activo: boolean; }
export interface Cotizacion { preliminar: boolean; subtotal: string; recargo_zona: string; total: string; }

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private http = inject(HttpClient);
  categorias() { return this.http.get<Categoria[]>(`${environment.apiUrl}/categorias?activo=1`); }
  tarifas() { return this.http.get<Tarifa[]>(`${environment.apiUrl}/tarifas?activo=1`); }
  zonas() { return this.http.get<Zona[]>(`${environment.apiUrl}/zonas?activo=1`); }
  cotizar(id_zona: number, id_tarifa: number, cantidad: number) {
    return this.http.post<Cotizacion>(`${environment.apiUrl}/cotizaciones/preliminar`, { id_zona, items: [{ id_tarifa, cantidad }] });
  }
}
