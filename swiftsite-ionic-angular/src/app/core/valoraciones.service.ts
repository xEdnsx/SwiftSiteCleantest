import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { OpinionPublica } from '../pages/home/opiniones';
import type { NuevaValoracion, ValoracionApi } from '../pages/valorar/valorar';

@Injectable({ providedIn: 'root' })
export class ValoracionesService {
  private http = inject(HttpClient);

  /** Envía la valoración de un pedido finalizado (una por pedido; queda en revisión hasta que el equipo la apruebe). */
  enviar(valoracion: NuevaValoracion) {
    return this.http.post<ValoracionApi>(`${environment.apiUrl}/valoraciones`, valoracion);
  }

  /** Opiniones que el equipo decidió mostrar en el Inicio (pública: no pide sesión). */
  publicas() {
    return this.http.get<OpinionPublica[]>(`${environment.apiUrl}/valoraciones-publicas`);
  }

  /** Valoraciones de la persona con sesión iniciada. */
  mias() {
    return this.http.get<ValoracionApi[]>(`${environment.apiUrl}/mis-valoraciones`);
  }
}
