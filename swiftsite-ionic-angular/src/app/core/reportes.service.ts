import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { NuevoReporte, ReporteApi } from '../pages/reportar/reportar';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);

  /** Envía el reporte de un pedido finalizado. */
  enviar(reporte: NuevoReporte) {
    return this.http.post<ReporteApi>(`${environment.apiUrl}/reportes`, reporte);
  }

  /** Reportes de la persona con sesión iniciada, del más reciente al más antiguo. */
  mios() {
    return this.http.get<ReporteApi[]>(`${environment.apiUrl}/mis-reportes`);
  }
}
